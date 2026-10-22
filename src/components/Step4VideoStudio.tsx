import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RefreshCw, Film, Loader2, ArrowRight, ArrowLeft, Volume2, VolumeX, CheckCircle2, Heart, MessageCircle, Share2, Bookmark, Sparkles } from 'lucide-react';
import { ProjectState, Scene } from '../types';
import { renderSceneVideoBlob, drawSceneFrame, preloadImage } from '../utils/videoRenderer';
import { generateAiSceneVideo } from '../utils/aiVideo';
import { playUiClick, playSuccessChime, speakTextWithVoice, stopSpeaking } from '../utils/audio';

interface Step4Props {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step4VideoStudio: React.FC<Step4Props> = ({
  project,
  updateProject,
  onNext,
  onPrev,
}) => {
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isRenderingSceneIdx, setIsRenderingSceneIdx] = useState<number | null>(null);
  const [isRenderingAll, setIsRenderingAll] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showSocialUiOverlay, setShowSocialUiOverlay] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentImgRef = useRef<HTMLImageElement | null>(null);

  const currentScene = project.scenes[selectedSceneIdx] || project.scenes[0];

  useEffect(() => {
    if (!currentScene) return;
    if (currentScene.imageUrl) {
      preloadImage(currentScene.imageUrl).then((img) => {
        currentImgRef.current = img;
        drawInitialFrame();
      });
    } else {
      currentImgRef.current = null;
      drawInitialFrame();
    }
  }, [selectedSceneIdx, currentScene?.imageUrl]);

  const drawInitialFrame = () => {
    if (!canvasRef.current || !currentScene) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    drawSceneFrame(ctx, currentImgRef.current, currentScene, 0, 720, 1280, '9:16');
  };

  const handlePlayPreview = () => {
    if (!currentScene || !canvasRef.current) return;

    if (isPlayingPreview) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      stopSpeaking();
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);
    playUiClick();

    if (!isAudioMuted && currentScene.narrationSegment) {
      speakTextWithVoice(currentScene.narrationSegment, project.voiceConfig);
    }

    const durationMs = (currentScene.durationSeconds || 5) * 1000;
    startTimeRef.current = performance.now();

    const loop = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawSceneFrame(ctx, currentImgRef.current, currentScene, progress, 720, 1280, '9:16');
        }
      }

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(loop);
      } else {
        setIsPlayingPreview(false);
        stopSpeaking();
      }
    };

    animationFrameId.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      stopSpeaking();
    };
  }, []);

  // 1. Generate Video for a Single Scene
  const handleGenerateSingleSceneVideo = async (index: number) => {
    const scene = project.scenes[index];
    if (!scene) return;

    setIsRenderingSceneIdx(index);
    setRenderProgress(0);
    playUiClick();

    try {
      const blob = await renderSceneVideoBlob(scene, (prog) => {
        setRenderProgress(Math.round(prog * 100));
      }, '9:16');

      const videoBlobUrl = URL.createObjectURL(blob);
      const updatedScenes = [...project.scenes];
      updatedScenes[index] = {
        ...scene,
        videoBlobUrl,
        isGenerated: true,
      };

      updateProject({ scenes: updatedScenes });
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert('Gagal merender video: ' + err?.message);
    } finally {
      setIsRenderingSceneIdx(null);
      setRenderProgress(0);
    }
  };

  // 2. Batch Render All Scenes
  const handleGenerateAllScenes = async () => {
    if (project.scenes.length === 0) return;
    setIsRenderingAll(true);
    playUiClick();

    try {
      const updatedScenes = [...project.scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        setSelectedSceneIdx(i);
        setIsRenderingSceneIdx(i);
        setRenderProgress(0);

        const blob = await renderSceneVideoBlob(updatedScenes[i], (prog) => {
          setRenderProgress(Math.round(prog * 100));
        }, '9:16');

        const videoBlobUrl = URL.createObjectURL(blob);
        updatedScenes[i] = {
          ...updatedScenes[i],
          videoBlobUrl,
          isGenerated: true,
        };
        updateProject({ scenes: [...updatedScenes] });
      }

      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kendala saat batch rendering video: ' + err?.message);
    } finally {
      setIsRenderingAll(false);
      setIsRenderingSceneIdx(null);
      setRenderProgress(0);
    }
  };

  // 3. AI Image-to-Veo: gambar statis -> video MP4 sungguhan (ala Google Flow)
  const [aiSceneIdx, setAiSceneIdx] = useState<number | null>(null);
  const [aiStatus, setAiStatus] = useState('');

  const handleGenerateAiVideo = async (index: number) => {
    const scene = project.scenes[index];
    if (!scene) return;

    playUiClick();
    setAiSceneIdx(index);
    setAiStatus('Memulai image-to-video AI...');

    try {
      const { videoUrl, model } = await generateAiSceneVideo(scene, setAiStatus);
      const updatedScenes = [...project.scenes];
      updatedScenes[index] = {
        ...scene,
        videoBlobUrl: videoUrl,
        isAiVideo: true,
        aiVideoModel: model,
        isGenerated: true,
      };
      updateProject({ scenes: updatedScenes });
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert('Gagal generate video AI (Google Veo): ' + (err?.message || err));
    } finally {
      setAiSceneIdx(null);
      setAiStatus('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-[#808080]/30 pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            4. GENERATE VIDEO 9:16 SCENE BY SCENE
          </h2>
          <p className="text-sm text-[#b3b3b3] mt-1 max-w-2xl leading-relaxed">
            Render video vertikal dari setiap beat storyboard: pakai <b className="text-white">AI Image-to-Video (Google Veo → MP4 sungguhan)</b> atau renderer kamera smartphone dengan teks pop-up TikTok &amp; subtitle safe-zone.
          </p>
        </div>

        {/* Batch Render Button */}
        <button
          onClick={handleGenerateAllScenes}
          disabled={isRenderingAll || isRenderingSceneIdx !== null}
          className="netflix-btn-primary min-h-[46px] disabled:opacity-50"
        >
          {isRenderingAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Memproses Semua Scene ({selectedSceneIdx + 1}/{project.scenes.length})...</span>
            </>
          ) : (
            <>
              <Film className="w-4 h-4 mr-2" />
              <span>GENERATE SEMUA SCENE VIDEO 9:16</span>
            </>
          )}
        </button>
      </div>

      {/* Active Voice Info Strip */}
      <div className="netflix-card p-3 mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <Volume2 className="w-4 h-4 text-[#e50914]" />
          <span className="text-[#b3b3b3]">Model Suara:</span>
          <span className="font-bold text-white">{project.voiceConfig?.voiceName || 'Bunda Rina (Kore)'}</span>
        </div>
        <span className="text-[11px] font-mono text-[#b3b3b3] bg-[#232323] px-2 py-0.5 rounded-[2px] border border-[#808080]/30">
          Pelafalan: "emjijinura dot e ay"
        </span>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Smartphone Vertical Mockup (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-[36px] p-2.5 shadow-2xl border-4 border-[#333333] select-none group">
            {/* Phone Speaker Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#1a1a1a] mr-2" />
              <div className="w-8 h-1.5 rounded-full bg-[#1a1a1a]" />
            </div>

            {/* Canvas Viewport */}
            <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-[#141414]">
              <canvas
                ref={canvasRef}
                width={720}
                height={1280}
                className="w-full h-full object-cover"
              />

              {/* Video AI (Google Veo MP4) — tampil di atas canvas bila sudah di-generate */}
              {currentScene?.videoBlobUrl && (
                <video
                  key={currentScene.videoBlobUrl}
                  src={currentScene.videoBlobUrl}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  autoPlay
                  loop
                  playsInline
                  muted
                  controls
                />
              )}

              {/* TikTok / Reels UI Overlay Simulation */}
              {showSocialUiOverlay && (
                <div className="absolute right-3 bottom-20 z-10 flex flex-col items-center space-y-4 pointer-events-none">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
                      <Heart className="w-5 h-5 fill-white" />
                    </div>
                    <span className="text-[10px] text-white font-bold mt-1">24.5K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
                      <MessageCircle className="w-5 h-5 fill-white/80" />
                    </div>
                    <span className="text-[10px] text-white font-bold mt-1">842</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
                      <Bookmark className="w-5 h-5 fill-white/80" />
                    </div>
                    <span className="text-[10px] text-white font-bold mt-1">5.2K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
                      <Share2 className="w-5 h-5 fill-white/80" />
                    </div>
                    <span className="text-[10px] text-white font-bold mt-1">Share</span>
                  </div>
                </div>
              )}

              {/* Play/Pause Overlay Indicator */}
              <button
                onClick={handlePlayPreview}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all"
              >
                {!isPlayingPreview && (
                  <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                )}
              </button>

              {/* Rendering Progress Overlay */}
              {isRenderingSceneIdx !== null && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                  <Loader2 className="w-10 h-10 text-[#e50914] animate-spin mb-3" />
                  <h4 className="text-sm font-bold text-white">
                    Merender Scene 9:16 #{isRenderingSceneIdx + 1}...
                  </h4>
                  <div className="w-48 bg-[#232323] h-2 rounded-[2px] mt-3 overflow-hidden border border-[#808080]/30">
                    <div
                      className="bg-[#e50914] h-full transition-all duration-150"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-[#e50914] mt-2">
                    {renderProgress}%
                  </span>
                  <span className="text-[10px] text-[#b3b3b3] mt-1">
                    Motion kamera smartphone &amp; burned-in caption safe zone.
                  </span>
                </div>
              )}

              {/* AI Veo Progress Overlay */}
              {aiSceneIdx !== null && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                  <Loader2 className="w-10 h-10 text-[#10b981] animate-spin mb-3" />
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Sparkles className="w-4 h-4 text-[#10b981] mr-1.5" />
                    Google Veo — Image to Video #{aiSceneIdx + 1}
                  </h4>
                  <p className="text-[11px] text-[#b3b3b3] mt-2 max-w-[240px] leading-relaxed">
                    {aiStatus || 'Sedang memproses...'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Under-Phone Quick Actions */}
          <div className="mt-4 flex items-center space-x-2 text-xs">
            <button
              onClick={handlePlayPreview}
              className="netflix-btn-primary min-h-[38px] text-xs"
            >
              {isPlayingPreview ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current mr-1.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current mr-1.5" />
                  <span>Putar Beat {currentScene?.sceneNumber}</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="p-2 bg-[#2d2d2d] hover:bg-[#363636] text-white rounded-[4px] border border-[#808080]/30"
              title={isAudioMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-[#808080]" /> : <Volume2 className="w-4 h-4 text-[#e50914]" />}
            </button>

            <button
              onClick={() => setShowSocialUiOverlay(!showSocialUiOverlay)}
              className="px-2.5 py-2 bg-[#2d2d2d] hover:bg-[#363636] text-white rounded-[4px] border border-[#808080]/30 text-[11px]"
            >
              {showSocialUiOverlay ? 'Sembunyikan UI TikTok' : 'Tampilkan UI TikTok'}
            </button>
          </div>
        </div>

        {/* Right: Scene Motion & Settings (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="netflix-card p-5 space-y-4">
            <div className="border-b border-[#808080]/30 pb-3">
              <span className="text-[10px] font-bold text-[#e50914] uppercase tracking-widest block">
                Pengaturan Beat #{currentScene?.sceneNumber}
              </span>
              <h3 className="text-base font-bold text-white">
                {currentScene?.sceneTitle}
              </h3>
              <span className="text-xs font-semibold text-white">
                {currentScene?.marketingBeat}
              </span>
            </div>

            {/* Motion Camera */}
            <div>
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1.5">
                Gaya Kamera Smartphone
              </label>
              <select
                value={currentScene?.cameraMovement || 'Handheld Phone Vlog'}
                onChange={(e) => {
                  const updated = [...project.scenes];
                  updated[selectedSceneIdx].cameraMovement = e.target.value as any;
                  updateProject({ scenes: updated });
                  playUiClick();
                }}
                className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Handheld Phone Vlog">Handheld Phone Vlog (Alami &amp; Organik)</option>
                <option value="Slow Zoom In">Slow Zoom In (Fokus Penekanan Masalah)</option>
                <option value="Close-Up Screen Tap">Close-Up Screen Tap (Demo Aplikasi mggnura)</option>
                <option value="Over-The-Shoulder POV">Over-The-Shoulder POV (POV Mengajar Anak)</option>
                <option value="Low Angle Toddler Eye-Level">Low Angle Toddler Eye-Level (Sudut Balita Ceria)</option>
                <option value="Gentle Pan Right">Gentle Pan Right</option>
                <option value="Gentle Pan Left">Gentle Pan Left</option>
              </select>
            </div>

            {/* On Screen Text */}
            {currentScene?.onScreenText && (
              <div className="bg-[#232323] border border-[#808080]/30 p-3 rounded-[4px]">
                <span className="text-[10px] font-bold text-[#e50914] uppercase block mb-1">
                  On-Screen Text Pop-Up:
                </span>
                <p className="text-xs font-black text-white">
                  {currentScene.onScreenText}
                </p>
              </div>
            )}

            {/* Narration */}
            <div className="bg-[#232323] p-3 rounded-[4px] border border-[#808080]/30">
              <span className="text-[10px] font-bold text-[#e50914] uppercase block mb-1">
                Voiceover Narasi:
              </span>
              <p className="text-xs text-white leading-relaxed italic">
                "{currentScene?.narrationSegment}"
              </p>
            </div>

            {/* Render this Scene Button */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleGenerateAiVideo(selectedSceneIdx)}
                disabled={aiSceneIdx !== null || isRenderingSceneIdx !== null}
                className="w-full netflix-btn-primary min-h-[40px] text-xs font-bold disabled:opacity-50 disabled:pointer-events-none"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current mr-1.5" />
                <span>
                  {aiSceneIdx === selectedSceneIdx
                    ? 'Veo Sedang Bekerja...'
                    : currentScene?.isAiVideo
                    ? 'Generate Ulang: AI Image-to-Video (Veo → MP4)'
                    : 'AI IMAGE-TO-VIDEO (Google Veo → MP4)'}
                </span>
              </button>

              <p className="text-[10px] text-[#808080] leading-relaxed">
                Veo menggerakkan gambar menjadi video sungguhan (MP4, 9:16, 4-8 detik). Butuh API
                key Gemini &amp; akses Veo; proses 1-3 menit. Hasil tersimpan sementara di browser —
                <span className="text-[#ffd166]"> unduh MP4-nya sebelum reload halaman</span>.
              </p>

              <button
                onClick={() => handleGenerateSingleSceneVideo(selectedSceneIdx)}
                disabled={isRenderingSceneIdx !== null || aiSceneIdx !== null}
                className="w-full netflix-btn-secondary min-h-[40px] text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#e50914] mr-1.5" />
                <span>
                  {currentScene?.isGenerated ? 'Re-generate Video Beat Ini' : 'Generate Video Beat Ini (9:16)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Timeline Carousel */}
      <div className="mt-8 pt-6 border-t border-[#808080]/30">
        <h4 className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-3">
          Timeline Scene Sequence ({project.scenes.length} Beat)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {project.scenes.map((scene, idx) => {
            const isSelected = selectedSceneIdx === idx;
            return (
              <div
                key={idx}
                onClick={() => {
                  playUiClick();
                  setSelectedSceneIdx(idx);
                }}
                className={`cursor-pointer rounded-[8px] overflow-hidden border p-2 transition-all text-left relative ${
                  isSelected
                    ? 'bg-[#363636] border-[#e50914] shadow-md'
                    : 'bg-[#2d2d2d] border-[#808080]/30 hover:border-[#808080]'
                }`}
              >
                {/* Thumbnail 9:16 */}
                <div className="relative aspect-[9/12] bg-[#181818] rounded-[4px] overflow-hidden mb-2">
                  {scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt={scene.sceneTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#808080]">
                      <Film className="w-6 h-6" />
                    </div>
                  )}

                  <div className="absolute top-1.5 left-1.5 bg-[#e50914] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-[2px]">
                    #{scene.sceneNumber}
                  </div>

                  {scene.isGenerated && (
                    <div className="absolute top-1.5 right-1.5 bg-[#232323]/90 text-white p-0.5 rounded-[2px]">
                      <CheckCircle2 className="w-3 h-3 text-[#e50914]" />
                    </div>
                  )}

                  {scene.isAiVideo && (
                    <div className="absolute bottom-1.5 left-1.5 bg-[#10b981] text-black text-[8px] font-black px-1 py-0.5 rounded-[2px]">
                      MP4 AI
                    </div>
                  )}
                </div>

                <div className="text-xs font-bold text-white truncate">
                  {scene.sceneTitle}
                </div>
                <div className="text-[10px] text-[#b3b3b3] mt-0.5 flex justify-between">
                  <span>{scene.durationSeconds} detik</span>
                  <span className="truncate max-w-[80px]">{scene.cameraMovement}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-10 pt-6 border-t border-[#808080]/30 flex items-center justify-between">
        <button
          onClick={() => {
            playUiClick();
            onPrev();
          }}
          className="netflix-btn-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Kembali ke Storyboard</span>
        </button>

        <button
          onClick={() => {
            playUiClick();
            onNext();
          }}
          className="netflix-btn-primary"
        >
          <span>Lanjut ke Review &amp; Download</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
