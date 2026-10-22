import React, { useState } from 'react';
import { Plus, Sparkles, Upload, Trash2, ArrowRight, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { ProjectState, VisualStyle } from '../types';
import { playUiClick, playSuccessChime } from '../utils/audio';

interface Step2Props {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const VISUAL_STYLES: { id: VisualStyle; name: string; desc: string; sampleColor: string }[] = [
  { id: 'Real Smartphone UGC Vlog', name: 'Smartphone UGC Vlog', desc: 'Paling konversi: natural seperti rekaman HP asli', sampleColor: '#e50914' },
  { id: 'Warm Parenting Home Aesthetic', name: 'Warm Home Aesthetic', desc: 'Suasana rumah hangat, furnitur kayu dan warna pastel', sampleColor: '#f59e0b' },
  { id: 'Modern 3D Animated Kids', name: '3D Kartun Edukasi', desc: 'Gaya animasi 3D ramah anak balita', sampleColor: '#3b82f6' },
  { id: 'Clean Studio Product Review', name: 'Clean Creator Studio', desc: 'Pencahayaan terang ala studio unboxing', sampleColor: '#8b5cf6' },
];

export const Step2AssetsStudio: React.FC<Step2Props> = ({
  project,
  updateProject,
  onNext,
  onPrev,
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'background' | 'object'>('character');
  const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);

  // New item modal/form states
  const [newChar, setNewChar] = useState({ name: '', role: 'Mom Creator', desc: '' });
  const [newBg, setNewBg] = useState({ name: '', time: 'Pagi Hari', desc: '' });
  const [newObj, setNewObj] = useState({ name: '', role: 'Mockup Smartphone', desc: '' });

  // 1. Generate Visual AI (9:16 vertical by default)
  const handleGenerateAssetVisual = async (
    id: string,
    prompt: string,
    type: 'character' | 'background' | 'object'
  ) => {
    setIsGeneratingId(id);
    playUiClick();

    try {
      const response = await fetch('/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type,
          style: project.visualStyle || 'Real Smartphone UGC Vlog',
          aspectRatio: project.aspectRatio || '9:16',
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal membuat visual.');
      }

      if (type === 'character') {
        const updated = project.characters.map((c) =>
          c.id === id ? { ...c, imageUrl: resData.imageUrl, isAiGenerated: true } : c
        );
        updateProject({ characters: updated });
      } else if (type === 'background') {
        const updated = project.backgrounds.map((b) =>
          b.id === id ? { ...b, imageUrl: resData.imageUrl, isAiGenerated: true } : b
        );
        updateProject({ backgrounds: updated });
      } else if (type === 'object') {
        const updated = project.objects.map((o) =>
          o.id === id ? { ...o, imageUrl: resData.imageUrl, isAiGenerated: true } : o
        );
        updateProject({ objects: updated });
      }

      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal membuat visual AI.');
    } finally {
      setIsGeneratingId(null);
    }
  };

  // 2. Custom Upload for Asset
  const handleUploadAssetImage = (
    id: string,
    file: File,
    type: 'character' | 'background' | 'object'
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      if (type === 'character') {
        const updated = project.characters.map((c) =>
          c.id === id ? { ...c, imageUrl: result, isAiGenerated: false } : c
        );
        updateProject({ characters: updated });
      } else if (type === 'background') {
        const updated = project.backgrounds.map((b) =>
          b.id === id ? { ...b, imageUrl: result, isAiGenerated: false } : b
        );
        updateProject({ backgrounds: updated });
      } else if (type === 'object') {
        const updated = project.objects.map((o) =>
          o.id === id ? { ...o, imageUrl: result, isAiGenerated: false } : o
        );
        updateProject({ objects: updated });
      }
      playSuccessChime();
    };
    reader.readAsDataURL(file);
  };

  const handleAddCharacter = () => {
    if (!newChar.name) return;
    playUiClick();
    const id = `char-${Date.now()}`;
    const item = {
      id,
      name: newChar.name,
      role: newChar.role,
      visualDescription: newChar.desc || `${newChar.name}, ${newChar.role} Indonesia ramah di depan kamera HP.`,
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=720&auto=format&fit=crop&q=80',
    };
    updateProject({ characters: [...project.characters, item] });
    setNewChar({ name: '', role: 'Mom Creator', desc: '' });
  };

  const handleAddBackground = () => {
    if (!newBg.name) return;
    playUiClick();
    const id = `bg-${Date.now()}`;
    const item = {
      id,
      name: newBg.name,
      timeOfDay: newBg.time,
      visualDescription: newBg.desc || `${newBg.name}, pencahayaan ${newBg.time} hangat.`,
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=720&auto=format&fit=crop&q=80',
    };
    updateProject({ backgrounds: [...project.backgrounds, item] });
    setNewBg({ name: '', time: 'Pagi Hari', desc: '' });
  };

  const handleAddObject = () => {
    if (!newObj.name) return;
    playUiClick();
    const id = `obj-${Date.now()}`;
    const item = {
      id,
      name: newObj.name,
      significance: newObj.role,
      visualDescription: newObj.desc || `${newObj.name} untuk demonstrasi mggnura.ai.`,
      imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=720&auto=format&fit=crop&q=80',
    };
    updateProject({ objects: [...project.objects, item] });
    setNewObj({ name: '', role: 'Mockup Smartphone', desc: '' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-[#808080]/30 pb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          2. ASET VISUAL, KARAKTER &amp; MOCKUP HP
        </h2>
        <p className="text-sm text-[#b3b3b3] mt-1 max-w-3xl leading-relaxed">
          Rancang visual pemeran (Mom Creator / Balita), latar belakang rumah ramah anak, dan mockup layar HP aplikasi <b>mggnura.ai</b>. Format rasio vertikal 9:16 untuk video feed TikTok dan Instagram Reels.
        </p>
      </div>

      {/* Visual Style Selector */}
      <div className="netflix-card p-5 mb-8">
        <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
          Gaya Visual Video (Aesthetic Preset)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {VISUAL_STYLES.map((style) => {
            const isSelected = (project.visualStyle || 'Real Smartphone UGC Vlog') === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  playUiClick();
                  updateProject({ visualStyle: style.id });
                }}
                className={`p-3 rounded-[4px] border text-left transition-all min-h-[74px] ${
                  isSelected
                    ? 'bg-[#363636] border-[#e50914] shadow-sm'
                    : 'bg-[#232323] border-[#808080]/30 hover:border-[#808080]'
                }`}
              >
                <div
                  className="w-full h-1 rounded-[2px] mb-2"
                  style={{ backgroundColor: style.sampleColor }}
                />
                <h4 className="text-xs font-bold text-white truncate">{style.name}</h4>
                <p className="text-[10px] text-[#b3b3b3] line-clamp-2 mt-0.5 leading-tight">{style.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#808080]/30 mb-6">
        <button
          onClick={() => {
            playUiClick();
            setActiveTab('character');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'character'
              ? 'border-[#e50914] text-white'
              : 'border-transparent text-[#808080] hover:text-white'
          }`}
        >
          <span>Karakter ({project.characters.length})</span>
        </button>

        <button
          onClick={() => {
            playUiClick();
            setActiveTab('background');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'background'
              ? 'border-[#e50914] text-white'
              : 'border-transparent text-[#808080] hover:text-white'
          }`}
        >
          <span>Background ({project.backgrounds.length})</span>
        </button>

        <button
          onClick={() => {
            playUiClick();
            setActiveTab('object');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'object'
              ? 'border-[#e50914] text-white'
              : 'border-transparent text-[#808080] hover:text-white'
          }`}
        >
          <span>Mockup HP ({project.objects.length})</span>
        </button>
      </div>

      {/* TAB 1: KARAKTER */}
      {activeTab === 'character' && (
        <div className="space-y-6">
          {/* Add Character Form */}
          <div className="netflix-card p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Nama Kreator / Tokoh
              </label>
              <input
                type="text"
                value={newChar.name}
                onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                placeholder="Misal: Bunda Maya"
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div className="w-44">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Peran
              </label>
              <select
                value={newChar.role}
                onChange={(e) => setNewChar({ ...newChar, role: e.target.value })}
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
              >
                <option value="Mom Creator">Mom Creator</option>
                <option value="Balita (2-3 Tahun)">Balita (2-3 Tahun)</option>
                <option value="Ayah / Papa">Ayah / Papa</option>
                <option value="Ahli / Psikolog Anak">Ahli / Psikolog Anak</option>
              </select>
            </div>

            <div className="flex-1 min-w-[240px]">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Deskripsi Visual Natural
              </label>
              <input
                type="text"
                value={newChar.desc}
                onChange={(e) => setNewChar({ ...newChar, desc: e.target.value })}
                placeholder="Ibu muda ramah memegang smartphone dengan ekspresi tersenyum..."
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <button
              onClick={handleAddCharacter}
              disabled={!newChar.name}
              className="netflix-btn-primary min-h-[38px] text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {project.characters.map((char) => (
              <div
                key={char.id}
                className="netflix-card overflow-hidden flex flex-col group"
              >
                {/* 9:16 Aspect Thumbnail Container */}
                <div className="relative aspect-[9/12] w-full bg-[#181818] overflow-hidden">
                  {char.imageUrl ? (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#808080]">
                      <ImageIcon className="w-8 h-8 mb-2 stroke-1" />
                      <span className="text-xs">Belum ada visual</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-[2px] shadow">
                    9:16 UGC
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{char.name}</h3>
                      <span className="text-[10px] bg-[#363636] border border-[#808080]/30 px-2 py-0.5 rounded-[2px] text-white">
                        {char.role}
                      </span>
                    </div>
                    <p className="text-xs text-[#b3b3b3] mt-1.5 line-clamp-2 leading-relaxed">
                      {char.visualDescription}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#808080]/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        handleGenerateAssetVisual(char.id, `${char.name}, ${char.role}, ${char.visualDescription}`, 'character')
                      }
                      disabled={isGeneratingId === char.id}
                      className="flex-1 py-1.5 px-2 bg-[#232323] hover:bg-[#e50914] text-white text-[11px] font-bold rounded-[4px] border border-[#808080]/30 hover:border-[#e50914] transition-all flex items-center justify-center space-x-1"
                    >
                      {isGeneratingId === char.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#e50914]" />
                          <span>Generate Visual AI</span>
                        </>
                      )}
                    </button>

                    <label className="p-1.5 bg-[#232323] hover:bg-[#383838] text-white rounded-[4px] border border-[#808080]/30 cursor-pointer transition-colors" title="Upload Foto Sendiri">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAssetImage(char.id, file, 'character');
                        }}
                      />
                    </label>

                    <button
                      onClick={() => {
                        playUiClick();
                        updateProject({
                          characters: project.characters.filter((c) => c.id !== char.id),
                        });
                      }}
                      className="p-1.5 bg-[#232323] hover:bg-[#e50914]/20 text-[#808080] hover:text-[#e50914] rounded-[4px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BACKGROUND */}
      {activeTab === 'background' && (
        <div className="space-y-6">
          <div className="netflix-card p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Nama Ruangan / Lokasi
              </label>
              <input
                type="text"
                value={newBg.name}
                onChange={(e) => setNewBg({ ...newBg, name: e.target.value })}
                placeholder="Misal: Ruang Bermain Balita"
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div className="w-40">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Waktu
              </label>
              <select
                value={newBg.time}
                onChange={(e) => setNewBg({ ...newBg, time: e.target.value })}
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Pagi Hari">Pagi Hari</option>
                <option value="Siang Hari">Siang Hari</option>
                <option value="Sore Hari">Sore Hari</option>
                <option value="Malam Hari (Bedtime)">Malam Hari (Bedtime)</option>
              </select>
            </div>

            <div className="flex-1 min-w-[240px]">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Deskripsi Suasana
              </label>
              <input
                type="text"
                value={newBg.desc}
                onChange={(e) => setNewBg({ ...newBg, desc: e.target.value })}
                placeholder="Ruangan santai dengan karpet anak dan rak buku..."
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <button
              onClick={handleAddBackground}
              disabled={!newBg.name}
              className="netflix-btn-primary min-h-[38px] text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {project.backgrounds.map((bg) => (
              <div
                key={bg.id}
                className="netflix-card overflow-hidden flex flex-col group"
              >
                <div className="relative aspect-[9/12] w-full bg-[#181818] overflow-hidden">
                  {bg.imageUrl ? (
                    <img
                      src={bg.imageUrl}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#808080]">
                      <ImageIcon className="w-8 h-8 mb-2 stroke-1" />
                      <span className="text-xs">Belum ada visual</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-[2px] shadow">
                    LOKASI
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{bg.name}</h3>
                      <span className="text-[10px] bg-[#363636] border border-[#808080]/30 px-2 py-0.5 rounded-[2px] text-white">
                        {bg.timeOfDay}
                      </span>
                    </div>
                    <p className="text-xs text-[#b3b3b3] mt-1.5 line-clamp-2 leading-relaxed">
                      {bg.visualDescription}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#808080]/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        handleGenerateAssetVisual(bg.id, `${bg.name}, ${bg.timeOfDay}, ${bg.visualDescription}`, 'background')
                      }
                      disabled={isGeneratingId === bg.id}
                      className="flex-1 py-1.5 px-2 bg-[#232323] hover:bg-[#e50914] text-white text-[11px] font-bold rounded-[4px] border border-[#808080]/30 hover:border-[#e50914] transition-all flex items-center justify-center space-x-1"
                    >
                      {isGeneratingId === bg.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#e50914]" />
                          <span>Generate Latar AI</span>
                        </>
                      )}
                    </button>

                    <label className="p-1.5 bg-[#232323] hover:bg-[#383838] text-white rounded-[4px] border border-[#808080]/30 cursor-pointer transition-colors" title="Upload Foto Ruangan">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAssetImage(bg.id, file, 'background');
                        }}
                      />
                    </label>

                    <button
                      onClick={() => {
                        playUiClick();
                        updateProject({
                          backgrounds: project.backgrounds.filter((b) => b.id !== bg.id),
                        });
                      }}
                      className="p-1.5 bg-[#232323] hover:bg-[#e50914]/20 text-[#808080] hover:text-[#e50914] rounded-[4px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OBJECT & MOCKUP HP */}
      {activeTab === 'object' && (
        <div className="space-y-6">
          <div className="netflix-card p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Nama Objek / Mockup
              </label>
              <input
                type="text"
                value={newObj.name}
                onChange={(e) => setNewObj({ ...newObj, name: e.target.value })}
                placeholder="Misal: Smartphone Layar mggnura.ai"
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <div className="w-44">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Fungsi dalam Konten
              </label>
              <input
                type="text"
                value={newObj.role}
                onChange={(e) => setNewObj({ ...newObj, role: e.target.value })}
                placeholder="Misal: Tampilan Demo 800 Cerita"
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex-1 min-w-[240px]">
              <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                Deskripsi Visual Layar
              </label>
              <input
                type="text"
                value={newObj.desc}
                onChange={(e) => setNewObj({ ...newObj, desc: e.target.value })}
                placeholder="Layar menampilkan interface dongeng interaktif mggnura.ai..."
                className="w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
              />
            </div>

            <button
              onClick={handleAddObject}
              disabled={!newObj.name}
              className="netflix-btn-primary min-h-[38px] text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {project.objects.map((obj) => (
              <div
                key={obj.id}
                className="netflix-card overflow-hidden flex flex-col group"
              >
                <div className="relative aspect-[9/12] w-full bg-[#181818] overflow-hidden">
                  {obj.imageUrl ? (
                    <img
                      src={obj.imageUrl}
                      alt={obj.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#808080]">
                      <ImageIcon className="w-8 h-8 mb-2 stroke-1" />
                      <span className="text-xs">Belum ada mockup</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-[2px] shadow">
                    MOCKUP APP
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{obj.name}</h3>
                    <p className="text-xs text-[#b3b3b3] mt-1 line-clamp-2 leading-relaxed">
                      {obj.visualDescription || obj.significance}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#808080]/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        handleGenerateAssetVisual(obj.id, `${obj.name}, ${obj.visualDescription}`, 'object')
                      }
                      disabled={isGeneratingId === obj.id}
                      className="flex-1 py-1.5 px-2 bg-[#232323] hover:bg-[#e50914] text-white text-[11px] font-bold rounded-[4px] border border-[#808080]/30 hover:border-[#e50914] transition-all flex items-center justify-center space-x-1"
                    >
                      {isGeneratingId === obj.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-[#e50914]" />
                          <span>Generate Mockup AI</span>
                        </>
                      )}
                    </button>

                    <label className="p-1.5 bg-[#232323] hover:bg-[#383838] text-white rounded-[4px] border border-[#808080]/30 cursor-pointer transition-colors" title="Upload Mockup">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAssetImage(obj.id, file, 'object');
                        }}
                      />
                    </label>

                    <button
                      onClick={() => {
                        playUiClick();
                        updateProject({
                          objects: project.objects.filter((o) => o.id !== obj.id),
                        });
                      }}
                      className="p-1.5 bg-[#232323] hover:bg-[#e50914]/20 text-[#808080] hover:text-[#e50914] rounded-[4px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
          <span>Kembali ke Naskah</span>
        </button>

        <button
          onClick={() => {
            playUiClick();
            onNext();
          }}
          className="netflix-btn-primary"
        >
          <span>Lanjut ke Storyboard 9:16</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
