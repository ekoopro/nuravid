import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, SkipForward, SkipBack, Film, FileText, Loader2, ArrowLeft, RefreshCw, Copy, Check, Smartphone, Share2, Sparkles } from 'lucide-react';
import { ProjectState, Scene } from '../types';
import { drawSceneFrame, preloadImage, renderFullMovieBlob, renderSceneVideoBlob } from '../utils/videoRenderer';
import { playNetflixTudum, playUiClick, playSuccessChime, speakTextWithVoice, stopSpeaking } from '../utils/audio';

interface Step5Props {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onPrev: () => void;
  onGoToStep: (step: number) => void;
}

export const Step5ReviewExport: React.FC<Step5Props> = ({
  project,
  updateProject,
  onPrev,
  onGoToStep,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Export states
  const [isExportingFullMovie, setIsExportingFullMovie] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [isRegeneratingScene, setIsRegeneratingScene] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const loadedImagesRef = useRef<(HTMLImageElement | null)[]>([]);

  const sceneDurations = project.scenes.map((s) => Math.max(3, s.durationSeconds || 5));
  const totalMovieDuration = sceneDurations.reduce((a, b) => a + b, 0);

  useEffect(() => {
    Promise.all(
      project.scenes.map((s) => (s.imageUrl ? preloadImage(s.imageUrl) : Promise.resolve(null)))
    ).then((imgs) => {
      loadedImagesRef.current = imgs;
      renderCurrentFrame();
    });

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      stopSpeaking();
    };
  }, [project.scenes]);

  const renderCurrentFrame = () => {
    if (!canvasRef.current || project.scenes.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const scene = project.scenes[currentSceneIdx] || project.scenes[0];
    const img = loadedImagesRef.current[currentSceneIdx] || null;
    drawSceneFrame(ctx, img, scene, 0, 720, 1280, '9:16');
  };

  useEffect(() => {
    if (!isPlaying) {
      renderCurrentFrame();
    }
  }, [currentSceneIdx]);

  // Master Playback Loop across all scenes
  const togglePlay = () => {
    if (isPlaying) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    playUiClick();

    const scene = project.scenes[currentSceneIdx];
    if (!isMuted && scene?.narrationSegment) {
      speakTextWithVoice(scene.narrationSegment, project.voiceConfig);
    }

    let lastTimestamp = performance.now();
    let accumulatedSceneTime = 0;
    let localSceneIdx = currentSceneIdx;

    const playLoop = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      accumulatedSceneTime += deltaSec;
      const targetSceneDuration = sceneDurations[localSceneIdx] || 5;
      const sceneProgress = Math.min(1, accumulatedSceneTime / targetSceneDuration);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const activeScene = project.scenes[localSceneIdx];
        const activeImg = loadedImagesRef.current[localSceneIdx] || null;
        if (ctx && activeScene) {
          drawSceneFrame(ctx, activeImg, activeScene, sceneProgress, 720, 1280, '9:16');
        }
      }

      if (sceneProgress >= 1) {
        // Transition to next scene
        if (localSceneIdx < project.scenes.length - 1) {
          localSceneIdx++;
          accumulatedSceneTime = 0;
          setCurrentSceneIdx(localSceneIdx);

          const nextScene = project.scenes[localSceneIdx];
          if (!isMuted && nextScene?.narrationSegment) {
            speakTextWithVoice(nextScene.narrationSegment, project.voiceConfig);
          }

          animationFrameId.current = requestAnimationFrame(playLoop);
        } else {
          // Reached end of entire video
          setIsPlaying(false);
          stopSpeaking();
          setCurrentSceneIdx(0);
        }
      } else {
        animationFrameId.current = requestAnimationFrame(playLoop);
      }
    };

    animationFrameId.current = requestAnimationFrame(playLoop);
  };

  // 1. Download Master Full Video (WebM / MP4)
  const handleDownloadFullMovie = async () => {
    if (project.scenes.length === 0) return;
    setIsExportingFullMovie(true);
    setExportProgress(0);
    setExportStatusText('Menginisialisasi pipeline rendering video 9:16...');
    playUiClick();

    try {
      const blob = await renderFullMovieBlob(
        project.scenes,
        (progress, status) => {
          setExportProgress(Math.round(progress * 100));
          setExportStatusText(status);
        },
        '9:16'
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (project.title || 'MGGNURA_VIDEO_916').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${cleanTitle}_FINAL_916.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekspor video: ' + err?.message);
    } finally {
      setIsExportingFullMovie(false);
      setExportProgress(0);
      setExportStatusText('');
    }
  };

  // 2. Download Single Scene Video
  const handleDownloadCurrentScene = async () => {
    const scene = project.scenes[currentSceneIdx];
    if (!scene) return;
    playUiClick();

    try {
      // Kalau scene punya video AI (Google Veo), unduh MP4 aslinya
      if (scene.isAiVideo && scene.videoBlobUrl) {
        const aiBlob = await fetch(scene.videoBlobUrl).then((r) => r.blob());
        const aiUrl = URL.createObjectURL(aiBlob);
        const aiLink = document.createElement('a');
        aiLink.href = aiUrl;
        aiLink.download = `Scene_${scene.sceneNumber}_${scene.sceneTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_AI.mp4`;
        document.body.appendChild(aiLink);
        aiLink.click();
        document.body.removeChild(aiLink);
        playSuccessChime();
        return;
      }

      const blob = await renderSceneVideoBlob(scene, () => {}, '9:16');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Scene_${scene.sceneNumber}_${scene.sceneTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_916.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengunduh klip scene: ' + err?.message);
    }
  };

  // 3. Download Full Script & Storyboard Document
  const handleDownloadScript = () => {
    playUiClick();
    let text = `========================================================\n`;
    text += `NURA VID - DOKUMEN PRODUKSI VIDEO MARKETING MGGNURA.AI\n`;
    text += `========================================================\n\n`;
    text += `JUDUL: ${project.title}\n`;
    text += `TAGLINE: ${project.tagline}\n`;
    text += `FORMAT: ${project.marketingFormat}\n`;
    text += `TARGET AUDIENS: ${project.audience}\n`;
    text += `ESTIMASI DURASI: ${totalMovieDuration} DETIK (9:16 Vertikal)\n`;
    text += `MODEL SUARA: ${project.voiceConfig?.voiceName || 'Bunda Rina (Kore)'}\n`;
    text += `EJAAN AUDIO RESMI: mggnura.ai dilafalkan sebagai 'emjijinura dot e ay'\n\n`;

    text += `HOOK 3 DETIK PERTAMA:\n"${project.hook3s}"\n\n`;

    text += `NASKAH LENGKAP VOICEOVER:\n${project.narration}\n\n`;

    text += `CALL TO ACTION (CTA):\n"${project.ctaText}"\n\n`;

    text += `--------------------------------------------------------\n`;
    text += `RINCIAN BEAT SCENE STORYBOARD:\n`;
    text += `--------------------------------------------------------\n`;

    project.scenes.forEach((s) => {
      text += `\n[BEAT #${s.sceneNumber}] ${s.sceneTitle.toUpperCase()} (${s.durationSeconds} Detik)\n`;
      text += `- Kategori Beat: ${s.marketingBeat}\n`;
      text += `- Teks Layar TikTok: "${s.onScreenText || '-'}"\n`;
      text += `- Voiceover: "${s.narrationSegment}"\n`;
      text += `- Arahan Visual: ${s.visualDescription}\n`;
      text += `- Gerakan Kamera: ${s.cameraMovement}\n`;
      text += `- Sound Effect (SFX): ${s.soundEffectCue}\n`;
    });

    text += `\n--------------------------------------------------------\n`;
    text += `CAPTION & HASHTAG SIAP POSTING (TIKTOK / REELS):\n`;
    text += `--------------------------------------------------------\n`;
    text += `${project.captionSocialMedia || ''}\n\n`;
    text += `${(project.targetHashtags || []).join(' ')}\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.title || 'NURA_VID_MGGNURA').replace(/[^a-zA-Z0-9_-]/g, '_')}_Naskah.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSuccessChime();
  };

  const handleCopyCaption = () => {
    const full = `${project.captionSocialMedia || ''}\n\n${(project.targetHashtags || []).join(' ')}`;
    navigator.clipboard.writeText(full);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    playUiClick();
  };

  const handleRegenerateCurrentScene = async () => {
    const scene = project.scenes[currentSceneIdx];
    if (!scene) return;

    setIsRegeneratingScene(true);
    playUiClick();

    try {
      const response = await fetch('/api/regenerate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene,
          instructions: 'Optimalkan hook narasi agar lebih relatable bagi orang tua balita 2-3 tahun.',
          storyContext: `${project.title}: ${project.tagline}`,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal regenerasi scene.');
      }

      const updated = [...project.scenes];
      updated[currentSceneIdx] = {
        ...resData.scene,
        sceneNumber: currentSceneIdx + 1,
        imageUrl: scene.imageUrl,
        isGenerated: true,
      };

      updateProject({ scenes: updated });
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert('Gagal regenerasi scene: ' + err?.message);
    } finally {
      setIsRegeneratingScene(false);
    }
  };

  const activeScene = project.scenes[currentSceneIdx] || project.scenes[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-[#808080]/30 pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            5. REVIEW, REGENERATE &amp; DOWNLOAD
          </h2>
          <p className="text-sm text-[#b3b3b3] mt-1 max-w-2xl leading-relaxed">
            Putar video 9:16 secara utuh di Cinema Theater Screen, lakukan regenerasi scene tertentu jika diperlukan, lalu unduh video lengkap beserta dokumen naskah.
          </p>
        </div>

        {/* Master Download Button */}
        <button
          onClick={handleDownloadFullMovie}
          disabled={isExportingFullMovie}
          className="netflix-btn-primary min-h-[46px] disabled:opacity-50"
        >
          {isExportingFullMovie ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Mengekspor Video ({exportProgress}%)...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              <span>DOWNLOAD VIDEO 9:16 (.WEBM)</span>
            </>
          )}
        </button>
      </div>

      {/* Exporting Progress Modal Overlay */}
      {isExportingFullMovie && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e50914]/20 border border-[#e50914] flex items-center justify-center mb-6 animate-pulse">
            <Smartphone className="w-8 h-8 text-[#e50914]" />
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
            MERENDER VIDEO MARKETING 9:16
          </h3>
          <p className="text-sm text-[#b3b3b3] max-w-md mb-6 leading-relaxed">
            {exportStatusText || 'Menyatukan ketukan video vertikal, motion kamera vlog, teks pop-up TikTok, dan subtitle safe-zone...'}
          </p>

          <div className="w-full max-w-md bg-[#232323] h-2.5 rounded-[2px] overflow-hidden border border-[#808080]/30 mb-3">
            <div
              className="bg-[#e50914] h-full transition-all duration-200"
              style={{ width: `${exportProgress}%` }}
            />
          </div>

          <span className="text-lg font-black text-[#e50914] tracking-wider">
            {exportProgress}% SELESAI
          </span>

          <span className="text-xs text-[#808080] mt-3">
            File video vertikal akan otomatis terunduh ke perangkat Anda saat selesai.
          </span>
        </div>
      )}

      {/* Main Theater View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Smartphone Player (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-[36px] p-2.5 shadow-2xl border-4 border-[#333333] select-none group">
            {/* Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a] ml-auto mr-2" />
            </div>

            <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-black">
              <canvas
                ref={canvasRef}
                width={720}
                height={1280}
                className="w-full h-full object-cover cursor-pointer"
                onClick={togglePlay}
              />

              {/* Big Center Play Indicator */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all"
              >
                {!isPlaying && (
                  <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110">
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  </div>
                )}
              </button>

              {/* Bottom Scrubber Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex flex-col space-y-2 opacity-95 group-hover:opacity-100 transition-opacity">
                {/* Red Scrubber Bar */}
                <div className="relative w-full h-1.5 bg-[#444] rounded-[2px] cursor-pointer flex items-center">
                  <div
                    className="bg-[#e50914] h-full rounded-[2px] transition-all"
                    style={{
                      width: `${((currentSceneIdx + 0.5) / Math.max(1, project.scenes.length)) * 100}%`,
                    }}
                  />
                  {project.scenes.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSceneIdx(idx);
                      }}
                      className={`absolute w-2 h-2 rounded-full border border-black transform -translate-y-1/2 top-1/2 ${
                        currentSceneIdx === idx ? 'bg-white scale-125' : 'bg-[#808080]'
                      }`}
                      style={{
                        left: `${(idx / Math.max(1, project.scenes.length - 1)) * 96 + 2}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between text-white text-xs">
                  <div className="flex items-center space-x-2">
                    <button onClick={togglePlay} className="p-1 hover:text-[#e50914]">
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                    <button
                      onClick={() => setCurrentSceneIdx(Math.max(0, currentSceneIdx - 1))}
                      disabled={currentSceneIdx === 0}
                      className="p-1 disabled:opacity-30"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentSceneIdx(Math.min(project.scenes.length - 1, currentSceneIdx + 1))}
                      disabled={currentSceneIdx === project.scenes.length - 1}
                      className="p-1 disabled:opacity-30"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="p-1">
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#808080]" /> : <Volume2 className="w-4 h-4 text-[#e50914]" />}
                    </button>
                  </div>

                  <span className="text-[11px] font-bold text-[#b3b3b3]">
                    Beat {currentSceneIdx + 1}/{project.scenes.length} ({totalMovieDuration}s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: In-Theater Regenerate & Export Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tuning Room */}
          <div className="netflix-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#808080]/30 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#e50914] uppercase tracking-widest block">
                  Tuning Beat #{activeScene?.sceneNumber}
                </span>
                <h3 className="text-base font-bold text-white">
                  {activeScene?.sceneTitle}
                </h3>
                <span className="text-xs font-semibold text-white">
                  {activeScene?.marketingBeat}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRegenerateCurrentScene}
                  disabled={isRegeneratingScene}
                  className="netflix-btn-secondary min-h-[36px] text-xs font-bold"
                >
                  {isRegeneratingScene ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 text-[#e50914] mr-1" />
                      <span>Regenerate Beat #{activeScene?.sceneNumber}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCurrentScene}
                  className="netflix-btn-secondary min-h-[36px] text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  <span>Unduh Klip</span>
                </button>
              </div>
            </div>

            {/* Beat details */}
            <div className="space-y-2.5 text-xs">
              {activeScene?.onScreenText && (
                <div className="bg-[#232323] border border-[#808080]/30 p-2.5 rounded-[4px]">
                  <span className="text-[10px] font-bold text-[#e50914] uppercase block mb-0.5">
                    Teks Layar:
                  </span>
                  <p className="font-bold text-white">{activeScene.onScreenText}</p>
                </div>
              )}

              <div className="bg-[#232323] p-2.5 rounded-[4px] border border-[#808080]/20">
                <span className="text-[#808080] font-bold uppercase block mb-0.5">
                  Voiceover Narasi:
                </span>
                <p className="text-white italic">"{activeScene?.narrationSegment}"</p>
              </div>
            </div>
          </div>

          {/* Export Center Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Master Video 9:16 */}
            <div className="netflix-card p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[4px] bg-[#e50914]/20 text-[#e50914] flex items-center justify-center mb-2.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Download Video 9:16 (.webm)
                </h4>
                <p className="text-xs text-[#b3b3b3] mt-1 leading-relaxed">
                  Video vertikal utuh dengan teks pop-up, audio voiceover, dan animasi siap upload ke TikTok / Reels.
                </p>
              </div>

              <button
                onClick={handleDownloadFullMovie}
                disabled={isExportingFullMovie}
                className="netflix-btn-primary mt-4 w-full text-xs"
              >
                <Download className="w-4 h-4 mr-2" />
                <span>Download Video 9:16</span>
              </button>
            </div>

            {/* Card 2: Social Media Caption & Hashtags */}
            <div className="netflix-card p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[4px] bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center mb-2.5">
                  <Share2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Salin Caption &amp; Hashtag
                </h4>
                <p className="text-xs text-[#b3b3b3] mt-1 leading-relaxed">
                  Salin caption persuasif dan hashtag terarah langsung ke aplikasi TikTok atau Instagram.
                </p>
              </div>

              <button
                onClick={handleCopyCaption}
                className="netflix-btn-secondary mt-4 w-full text-xs"
              >
                {copiedCaption ? <Check className="w-4 h-4 text-[#e50914] mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                <span>{copiedCaption ? 'Tersalin' : 'Salin Caption'}</span>
              </button>
            </div>

            {/* Card 3: Production Script TXT */}
            <div className="netflix-card p-4 flex flex-col justify-between sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-[#e50914]" />
                    Ekspor Dokumen Naskah &amp; Beat Storyboard (.txt)
                  </h4>
                  <p className="text-xs text-[#b3b3b3] mt-0.5">
                    Berkas teks lengkap berisi hook, naskah voiceover, panduan teks layar, dan arahan kamera.
                  </p>
                </div>
                <button
                  onClick={handleDownloadScript}
                  className="netflix-btn-secondary text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  <span>Unduh Dokumen</span>
                </button>
              </div>
            </div>
          </div>
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
          <span>Kembali ke Video Studio</span>
        </button>

        <button
          onClick={() => {
            playNetflixTudum();
            onGoToStep(1);
          }}
          className="netflix-btn-secondary"
        >
          <Sparkles className="w-4 h-4 text-[#e50914] mr-2" />
          <span>Buat Konsep Video Baru</span>
        </button>
      </div>
    </div>
  );
};
