import React, { useState } from 'react';
import { Sparkles, RefreshCw, Plus, Trash2, ArrowUp, ArrowDown, Edit3, Image as ImageIcon, Loader2, ArrowRight, ArrowLeft, Volume2, Smartphone } from 'lucide-react';
import { ProjectState, Scene, CameraMovement } from '../types';
import { playUiClick, playSuccessChime, speakTextWithVoice } from '../utils/audio';

interface Step3Props {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CAMERA_MOVEMENTS: CameraMovement[] = [
  'Handheld Phone Vlog',
  'Slow Zoom In',
  'Close-Up Screen Tap',
  'Over-The-Shoulder POV',
  'Low Angle Toddler Eye-Level',
  'Gentle Pan Right',
  'Gentle Pan Left',
  'Static Clean Framing',
];

export const Step3Storyboard: React.FC<Step3Props> = ({
  project,
  updateProject,
  onNext,
  onPrev,
}) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [autoSceneMode, setAutoSceneMode] = useState(true);
  const [manualSceneCount, setManualSceneCount] = useState(5);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [tweakModalIdx, setTweakModalIdx] = useState<number | null>(null);
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [generatingVisualIdx, setGeneratingVisualIdx] = useState<number | null>(null);

  // 1. Generate Storyboard Otomatis (Auto Scene Detection)
  const handleGenerateStoryboard = async () => {
    setIsGeneratingAll(true);
    playUiClick();

    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          narration: project.narration,
          idea: project.idea,
          characters: project.characters,
          backgrounds: project.backgrounds,
          objects: project.objects,
          visualStyle: project.visualStyle || 'Real Smartphone UGC Vlog',
          preferredSceneCount: autoSceneMode ? 0 : manualSceneCount,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menyusun storyboard.');
      }

      const { scenes, totalScenes, pacingReason } = resData.data;

      const enrichedScenes: Scene[] = scenes.map((s: any, idx: number) => {
        let matchedImage = project.backgrounds[0]?.imageUrl || project.characters[0]?.imageUrl;
        if (s.marketingBeat?.includes('Solusi') && project.objects[0]?.imageUrl) {
          matchedImage = project.objects[0].imageUrl;
        }

        return {
          ...s,
          sceneNumber: idx + 1,
          imageUrl: matchedImage || project.scenes[idx]?.imageUrl,
          isGenerated: true,
        };
      });

      updateProject({
        scenes: enrichedScenes,
        totalScenes: totalScenes || enrichedScenes.length,
        pacingReason: pacingReason || 'Jumlah beat scene ditentukan otomatis untuk konversi optimal TikTok 9:16.',
      });

      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal memproses storyboard otomatis.');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // 2. Regenerate a Single Scene
  const handleRegenerateScene = async (index: number, customInstructions?: string) => {
    setRegeneratingIdx(index);
    playUiClick();

    try {
      const currentScene = project.scenes[index];
      const response = await fetch('/api/regenerate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: currentScene,
          instructions: customInstructions,
          storyContext: `${project.title}: ${project.tagline} (${project.marketingFormat})`,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal regenerasi scene.');
      }

      const updated = [...project.scenes];
      updated[index] = {
        ...resData.scene,
        sceneNumber: index + 1,
        imageUrl: currentScene.imageUrl,
        isGenerated: true,
      };

      updateProject({ scenes: updated });
      setTweakModalIdx(null);
      setTweakPrompt('');
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal regenerasi scene.');
    } finally {
      setRegeneratingIdx(null);
    }
  };

  // 3. Generate Image for a Single Scene
  const handleGenerateSceneVisual = async (index: number) => {
    const scene = project.scenes[index];
    if (!scene) return;

    setGeneratingVisualIdx(index);
    playUiClick();

    try {
      const prompt = `${scene.visualDescription}, ${scene.backgroundSetting}, menampilkan ${scene.characterNames?.join(', ') || 'Bunda'}`;
      const response = await fetch('/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'scene',
          style: project.visualStyle || 'Real Smartphone UGC Vlog',
          aspectRatio: '9:16',
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal membuat visual 9:16.');
      }

      const updated = [...project.scenes];
      updated[index] = {
        ...scene,
        imageUrl: resData.imageUrl,
        isGenerated: true,
      };

      updateProject({ scenes: updated });
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal membuat visual 9:16.');
    } finally {
      setGeneratingVisualIdx(null);
    }
  };

  const handleMoveScene = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= project.scenes.length) return;

    playUiClick();
    const updated = [...project.scenes];
    const temp = updated[fromIndex];
    updated[fromIndex] = updated[toIndex];
    updated[toIndex] = temp;

    updated.forEach((s, idx) => {
      s.sceneNumber = idx + 1;
    });

    updateProject({ scenes: updated });
  };

  const handleDeleteScene = (index: number) => {
    if (project.scenes.length <= 1) {
      alert('Minimal harus memiliki 1 beat scene.');
      return;
    }
    if (window.confirm(`Hapus Scene ${index + 1}?`)) {
      playUiClick();
      const updated = project.scenes.filter((_, i) => i !== index);
      updated.forEach((s, idx) => {
        s.sceneNumber = idx + 1;
      });
      updateProject({ scenes: updated, totalScenes: updated.length });
    }
  };

  const handleUpdateSceneField = (index: number, field: keyof Scene, value: any) => {
    const updated = [...project.scenes];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    updateProject({ scenes: updated });
  };

  // Add Scene Manual
  const handleAddSceneManual = () => {
    const newNum = project.scenes.length + 1;
    const newScene: Scene = {
      sceneNumber: newNum,
      sceneTitle: `Beat ${newNum}: Momen Tambahan`,
      marketingBeat: '04. Transformasi & Bukti',
      durationSeconds: 5,
      narrationSegment: 'Lanjutan penjelasan manfaat mggnura.ai...',
      onScreenText: 'COBA SEKARANG JUGA!',
      visualDescription: 'Bunda menunjukkan layar HP sambil tersenyum ke kamera.',
      cameraMovement: 'Handheld Phone Vlog',
      characterNames: project.characters.map((c) => c.name),
      backgroundSetting: project.backgrounds[0]?.name || 'Ruang Keluarga',
      soundEffectCue: 'Chime ceria',
      transition: 'Cross Dissolve',
      imageUrl: project.characters[0]?.imageUrl || project.backgrounds[0]?.imageUrl,
    };
    updateProject({ scenes: [...project.scenes, newScene], totalScenes: newNum });
    playUiClick();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-[#808080]/30 pb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            3. STORYBOARD 9:16 (AUTO SCENE DETECTION)
          </h2>
          <p className="text-sm text-[#b3b3b3] mt-1 max-w-2xl leading-relaxed">
            AI membagi naskah ke dalam ketukan video vertikal 9:16 (Hook 3 detik, Problem, Solusi mggnura.ai, dan CTA). Setiap scene dapat disesuaikan dan diregenerate.
          </p>
        </div>

        {/* Master Storyboard Generator Card */}
        <div className="netflix-card p-3.5 flex flex-wrap items-center gap-3">
          <div className="flex flex-col text-left">
            <label className="text-xs text-white font-bold flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSceneMode}
                onChange={(e) => setAutoSceneMode(e.target.checked)}
                className="accent-[#e50914] mr-2"
              />
              <span>Otomatis AI (Rekomendasi)</span>
            </label>
            {!autoSceneMode && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[10px] text-[#b3b3b3]">Jumlah:</span>
                <input
                  type="number"
                  min="3"
                  max="8"
                  value={manualSceneCount}
                  onChange={(e) => setManualSceneCount(Number(e.target.value))}
                  className="w-12 bg-[#232323] border border-[#808080]/40 text-center text-xs text-white rounded-[2px] py-0.5"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateStoryboard}
            disabled={isGeneratingAll || !project.narration}
            className="netflix-btn-primary min-h-[40px] text-xs disabled:opacity-50"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Menyusun Storyboard...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                <span>{project.scenes.length > 0 ? 'REGENERATE STORYBOARD' : 'GENERATE STORYBOARD'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pacing Reason */}
      {project.pacingReason && (
        <div className="mb-6 bg-[#2d2d2d] border border-[#808080]/30 rounded-[4px] p-4 flex items-start space-x-3">
          <div className="p-2 bg-[#e50914]/20 rounded-[2px] text-[#e50914]">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Analisis Formula ({project.scenes.length} Beat Scene Terdeteksi)
            </h4>
            <p className="text-xs text-[#b3b3b3] mt-0.5 leading-relaxed">
              {project.pacingReason}
            </p>
          </div>
        </div>
      )}

      {/* Scene List */}
      <div className="space-y-6">
        {project.scenes.map((scene, idx) => {
          const isEditing = editingSceneIdx === idx;
          const isRegenerating = regeneratingIdx === idx;
          const isGeneratingVisual = generatingVisualIdx === idx;

          return (
            <div
              key={idx}
              className="netflix-card overflow-hidden"
            >
              {/* Scene Header */}
              <div className="bg-[#363636] px-4 py-3 border-b border-[#808080]/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="bg-[#e50914] text-white font-black text-xs px-2 py-0.5 rounded-[2px]">
                    BEAT #{scene.sceneNumber}
                  </span>
                  <span className="text-xs font-bold text-white bg-[#232323] px-2 py-0.5 rounded-[2px] border border-[#808080]/30">
                    {scene.marketingBeat || `Scene ${scene.sceneNumber}`}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {scene.sceneTitle}
                  </h3>
                </div>

                {/* Quick Controls */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="bg-[#232323] text-[#b3b3b3] px-2 py-1 rounded-[2px] border border-[#808080]/30">
                    {scene.durationSeconds} detik
                  </span>
                  <span className="bg-[#232323] text-white px-2 py-1 rounded-[2px] border border-[#808080]/30">
                    {scene.cameraMovement}
                  </span>

                  <button
                    onClick={() => handleMoveScene(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-[2px] bg-[#232323] hover:bg-[#404040] text-[#b3b3b3] disabled:opacity-30"
                    title="Geser Naik"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveScene(idx, 'down')}
                    disabled={idx === project.scenes.length - 1}
                    className="p-1.5 rounded-[2px] bg-[#232323] hover:bg-[#404040] text-[#b3b3b3] disabled:opacity-30"
                    title="Geser Turun"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setEditingSceneIdx(isEditing ? null : idx)}
                    className={`px-2.5 py-1 rounded-[2px] text-xs font-bold transition-colors ${
                      isEditing ? 'bg-[#e50914] text-white' : 'bg-[#232323] hover:bg-[#404040] text-white border border-[#808080]/30'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                    {isEditing ? 'Simpan' : 'Edit'}
                  </button>

                  <button
                    onClick={() => setTweakModalIdx(idx)}
                    disabled={isRegenerating}
                    className="px-2.5 py-1 rounded-[2px] bg-[#232323] hover:bg-[#e50914] text-white text-xs font-bold border border-[#808080]/30 hover:border-[#e50914] transition-colors"
                  >
                    {isRegenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                    )}
                    <span>Regenerate</span>
                  </button>

                  <button
                    onClick={() => handleDeleteScene(idx)}
                    className="p-1.5 rounded-[2px] bg-[#232323] hover:bg-[#e50914]/20 text-[#808080] hover:text-[#e50914]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scene Content Grid */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left: 9:16 Visual Keyframe (3 cols) */}
                <div className="lg:col-span-3 flex flex-col items-center">
                  <div className="relative aspect-[9/16] w-full max-w-[190px] bg-[#181818] rounded-[8px] overflow-hidden border border-[#808080]/30 shadow-md group">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.sceneTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-[#808080]">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Belum ada visual 9:16</span>
                      </div>
                    )}

                    {/* On-screen text preview */}
                    {scene.onScreenText && (
                      <div className="absolute top-8 inset-x-2 bg-black/85 border border-[#e50914] rounded-[2px] p-1 text-[9px] font-black text-white text-center leading-tight">
                        {scene.onScreenText}
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 bg-black/85 px-1.5 py-0.5 rounded-[2px] text-[9px] text-[#b3b3b3]">
                      {scene.cameraMovement}
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerateSceneVisual(idx)}
                    disabled={isGeneratingVisual}
                    className="mt-2.5 w-full max-w-[190px] py-1.5 px-2 bg-[#232323] hover:bg-[#e50914] text-white text-[11px] font-bold rounded-[4px] border border-[#808080]/30 hover:border-[#e50914] transition-all flex items-center justify-center space-x-1"
                  >
                    {isGeneratingVisual ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        <span>Rendering 9:16...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-[#e50914] mr-1" />
                        <span>Generate Visual 9:16</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right: Scene Details / Editor (9 cols) */}
                <div className="lg:col-span-9 space-y-3">
                  {isEditing ? (
                    /* EDIT MODE */
                    <div className="space-y-3 bg-[#232323] p-4 rounded-[4px] border border-[#808080]/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-[#b3b3b3] uppercase mb-1">
                            Judul Beat Scene
                          </label>
                          <input
                            type="text"
                            value={scene.sceneTitle}
                            onChange={(e) => handleUpdateSceneField(idx, 'sceneTitle', e.target.value)}
                            className="w-full bg-[#181818] border border-[#808080]/40 rounded-[2px] px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#b3b3b3] uppercase mb-1">
                            Durasi (Detik)
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="15"
                            value={scene.durationSeconds}
                            onChange={(e) => handleUpdateSceneField(idx, 'durationSeconds', Number(e.target.value))}
                            className="w-full bg-[#181818] border border-[#808080]/40 rounded-[2px] px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#e50914] uppercase mb-1">
                          Teks Layar Pop-Up (TikTok Style)
                        </label>
                        <input
                          type="text"
                          value={scene.onScreenText || ''}
                          onChange={(e) => handleUpdateSceneField(idx, 'onScreenText', e.target.value)}
                          placeholder="Misal: ANAK 2 TAHUN TANTRUM GARA-GARA HP?!"
                          className="w-full bg-[#181818] border border-[#808080]/40 rounded-[2px] px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#e50914]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#b3b3b3] uppercase mb-1">
                          Naskah Narasi Voiceover Beat Ini
                        </label>
                        <textarea
                          rows={2}
                          value={scene.narrationSegment}
                          onChange={(e) => handleUpdateSceneField(idx, 'narrationSegment', e.target.value)}
                          className="w-full bg-[#181818] border border-[#808080]/40 rounded-[2px] p-2.5 text-xs text-white focus:outline-none focus:border-[#e50914]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-[#b3b3b3] uppercase mb-1">
                            Gerakan Kamera
                          </label>
                          <select
                            value={scene.cameraMovement}
                            onChange={(e) => handleUpdateSceneField(idx, 'cameraMovement', e.target.value)}
                            className="w-full bg-[#181818] border border-[#808080]/40 rounded-[2px] px-3 py-1.5 text-xs text-white"
                          >
                            {CAMERA_MOVEMENTS.map((cam) => (
                              <option key={cam} value={cam}>{cam}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#b3b3b3] uppercase mb-1">
                            Efek Suara (SFX)
                          </label>
                          <input
                            type="text"
                            value={scene.soundEffectCue}
                            onChange={(e) => handleUpdateSceneField(idx, 'soundEffectCue', e.target.value)}
                            className="w-full bg-[#181818] border border-[#808080]/40 rounded-[2px] px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="space-y-3">
                      {scene.onScreenText && (
                        <div className="bg-[#232323] border border-[#808080]/30 p-2.5 rounded-[4px] flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-[#e50914] uppercase">Teks Layar:</span>
                            <span className="text-xs font-bold text-white">{scene.onScreenText}</span>
                          </div>
                          <span className="text-[10px] text-[#b3b3b3] bg-[#363636] px-1.5 py-0.5 rounded-[2px]">
                            TikTok Safe Zone
                          </span>
                        </div>
                      )}

                      <div className="bg-[#232323] p-3 rounded-[4px] border border-[#808080]/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-[#b3b3b3] uppercase">
                            Narasi Voiceover ({scene.durationSeconds} Detik)
                          </span>
                          <button
                            onClick={() => speakTextWithVoice(scene.narrationSegment, project.voiceConfig)}
                            className="text-[11px] text-[#e50914] hover:text-white font-bold flex items-center"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            <span>Dengarkan Suara</span>
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-white leading-relaxed">
                          "{scene.narrationSegment}"
                        </p>
                      </div>

                      <div className="p-3 bg-[#232323] rounded-[4px] border border-[#808080]/20 text-xs">
                        <span className="text-[10px] font-bold text-[#b3b3b3] uppercase block mb-0.5">
                          Arahan Visual 9:16
                        </span>
                        <p className="text-xs text-[#b3b3b3] leading-relaxed">
                          {scene.visualDescription}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="bg-[#232323] text-white border border-[#808080]/30 px-2 py-0.5 rounded-[2px] text-[11px]">
                          Gerakan: {scene.cameraMovement}
                        </span>
                        <span className="bg-[#232323] text-[#b3b3b3] border border-[#808080]/30 px-2 py-0.5 rounded-[2px] text-[11px]">
                          SFX: {scene.soundEffectCue}
                        </span>
                        <span className="bg-[#232323] text-[#b3b3b3] border border-[#808080]/30 px-2 py-0.5 rounded-[2px] text-[11px]">
                          Latar: {scene.backgroundSetting}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Scene Manual */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleAddSceneManual}
            className="netflix-btn-secondary"
          >
            <Plus className="w-4 h-4 mr-2 text-[#e50914]" />
            <span>Tambah Beat Scene Manual</span>
          </button>
        </div>
      </div>

      {/* Tweak Modal */}
      {tweakModalIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#2d2d2d] border border-[#808080]/40 rounded-[8px] max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-[#e50914]" />
              Regenerate Beat {project.scenes[tweakModalIdx]?.sceneNumber}
            </h3>
            <p className="text-xs text-[#b3b3b3] mb-4">
              Berikan arahan untuk scene ini (misal: "Buat on-screen text lebih bikin penasaran", "Ganti ke close-up tap layar HP mggnura.ai", "Ubah ekspresi anak").
            </p>

            <textarea
              rows={3}
              value={tweakPrompt}
              onChange={(e) => setTweakPrompt(e.target.value)}
              placeholder="Contoh: Fokuskan visual ke antusiasme anak melihat cerita di HP mggnura.ai..."
              className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] p-3 text-xs text-white focus:outline-none mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setTweakModalIdx(null)}
                className="netflix-btn-secondary min-h-[38px] text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => handleRegenerateScene(tweakModalIdx, tweakPrompt)}
                className="netflix-btn-primary min-h-[38px] text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Regenerate Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span>Kembali ke Aset</span>
        </button>

        <button
          onClick={() => {
            playUiClick();
            onNext();
          }}
          disabled={project.scenes.length === 0}
          className="netflix-btn-primary disabled:opacity-50 disabled:pointer-events-none"
        >
          <span>Lanjut ke Video Studio 9:16</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
