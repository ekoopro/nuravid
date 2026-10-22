import React, { useState } from 'react';
import { Sparkles, Loader2, Play, Square, ArrowRight, Clock, Smartphone, MessageSquareText, Copy, Check } from 'lucide-react';
import { ProjectState, MarketingFormat } from '../types';
import { playUiClick, playSuccessChime, speakTextWithVoice, stopSpeaking } from '../utils/audio';
import { VoiceSelector } from './VoiceSelector';

interface Step1Props {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onNext: () => void;
}

const MARKETING_FORMATS: { id: MarketingFormat; label: string; desc: string; icon: string }[] = [
  {
    id: 'POV Drama Relatable',
    label: 'POV Drama Relatable',
    desc: 'Drama emosional sehari-hari orang tua dan anak tantrum gadget',
    icon: '🎭',
  },
  {
    id: 'UGC Review & Testimoni',
    label: 'UGC Review & Testimoni',
    desc: 'Review jujur kreator sambil demonstrasi aplikasi mggnura.ai',
    icon: '📱',
  },
  {
    id: 'Edukasi Parenting Soft-Selling',
    label: 'Tips Parenting (Soft Selling)',
    desc: 'Edukasi stimulasi anak 2-3 tahun dengan rekomendasi mggnura.ai',
    icon: '💡',
  },
  {
    id: 'Promo Diskon & Hard-Selling',
    label: 'Promo Free Trial 7 Hari',
    desc: 'Fokus penawaran uji coba gratis 7 hari dengan ajakan jelas',
    icon: '🔥',
  },
];

const PAIN_POINT_CHIPS = [
  'Anak 2 tahun tantrum kalau HP diambil (kecanduan YouTube pasif)',
  'Speech delay & bingung cara stimulasi bicara anak 2-3 tahun',
  'Ibu bekerja merasa bersalah kurang waktu mengajar anak di rumah',
  'Khawatir konten video YouTube ada iklan & tontonan berbahaya',
  'Anak gampang bosan dengan buku cerita fisik biasa',
];

export const Step1IdeaNarration: React.FC<Step1Props> = ({
  project,
  updateProject,
  onNext,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const wordCount = project.narration ? project.narration.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 135) * 60);

  const handleGenerateMarketingNarasi = async () => {
    if (!project.idea || project.idea.trim().length < 5) {
      setError('Masukkan ide atau topik video sebelum generate naskah.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    playUiClick();

    try {
      const response = await fetch('/api/generate-narasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: project.idea,
          marketingFormat: project.marketingFormat || 'POV Drama Relatable',
          targetPainPoint: project.targetPainPoint,
          targetDuration: project.targetDuration || 30,
          language: project.language || 'Indonesian',
          audience: project.audience || 'Orang Tua Balita Usia 2-3 Tahun',
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menghasilkan naskah marketing.');
      }

      const {
        title,
        tagline,
        hook3s,
        narration,
        captionSocialMedia,
        targetHashtags,
        characters,
        backgrounds,
        objects,
      } = resData.data;

      updateProject({
        title: title || project.title,
        tagline: tagline || project.tagline,
        hook3s: hook3s || project.hook3s,
        narration: narration || project.narration,
        captionSocialMedia: captionSocialMedia || project.captionSocialMedia,
        targetHashtags: targetHashtags?.length ? targetHashtags : project.targetHashtags,
        characters: characters?.length ? characters : project.characters,
        backgrounds: backgrounds?.length ? backgrounds : project.backgrounds,
        objects: objects?.length ? objects : project.objects,
      });

      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Terjadi kendala saat generate naskah marketing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleVoicePreview = () => {
    if (isPlayingVoice) {
      stopSpeaking();
      setIsPlayingVoice(false);
    } else {
      if (!project.narration) return;
      setIsPlayingVoice(true);
      speakTextWithVoice(project.narration, project.voiceConfig, () => {
        setIsPlayingVoice(false);
      });
    }
  };

  const handleCopyCaption = () => {
    const fullCaption = `${project.captionSocialMedia || ''}\n\n${(project.targetHashtags || []).join(' ')}`;
    navigator.clipboard.writeText(fullCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    playUiClick();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-[#808080]/30 pb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          1. INPUT KONSEP &amp; GENERATE NASKAH
        </h2>
        <p className="text-sm text-[#b3b3b3] mt-1 max-w-3xl leading-relaxed">
          Pabrik naskah video berkonversi tinggi untuk menjual aplikasi <b>mggnura.ai</b>. Menghasilkan Hook 3 detik anti-skip, bahasa santai ala ibu muda, dan Call To Action yang mendorong klik link bio.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#e50914]/15 border border-[#e50914]/50 rounded-[4px] text-sm text-white flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Left Formulation Input (5 cols) / Right Script Output (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Marketing Inputs */}
        <div className="lg:col-span-5 space-y-5">
          <div className="netflix-card p-5 space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                Pilih Format Konten Video
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MARKETING_FORMATS.map((fmt) => {
                  const isSelected = (project.marketingFormat || 'POV Drama Relatable') === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        playUiClick();
                        updateProject({ marketingFormat: fmt.id });
                      }}
                      className={`p-2.5 rounded-[4px] border text-left transition-all min-h-[70px] ${
                        isSelected
                          ? 'bg-[#363636] border-[#e50914] shadow-sm'
                          : 'bg-[#232323] border-[#808080]/30 hover:border-[#808080]'
                      }`}
                    >
                      <span className="text-base block mb-0.5">{fmt.icon}</span>
                      <h4 className="text-xs font-bold text-white truncate">{fmt.label}</h4>
                      <p className="text-[10px] text-[#b3b3b3] line-clamp-2 mt-0.5 leading-tight">{fmt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pain Point Target */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Titik Masalah Orang Tua (Pain Point)</span>
                <span className="text-[10px] text-[#b3b3b3] font-normal">Pilih opsi</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PAIN_POINT_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playUiClick();
                      updateProject({ targetPainPoint: chip });
                    }}
                    className={`text-[11px] px-2 py-1 rounded-[2px] border text-left transition-colors ${
                      project.targetPainPoint === chip
                        ? 'bg-[#e50914] text-white border-[#e50914] font-bold'
                        : 'bg-[#232323] text-[#b3b3b3] border-[#808080]/30 hover:border-[#808080] hover:text-white'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={project.targetPainPoint || ''}
                onChange={(e) => updateProject({ targetPainPoint: e.target.value })}
                placeholder="Ketik keluhan orang tua lainnya..."
                className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] px-3 py-2 text-xs text-white placeholder-[#808080] focus:outline-none"
              />
            </div>

            {/* Idea / Premise Input */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Topik / Premis Ide Konten Video</span>
                <span className="text-[10px] text-[#e50914] font-bold">Wajib diisi</span>
              </label>
              <textarea
                rows={3}
                value={project.idea}
                onChange={(e) => updateProject({ idea: e.target.value })}
                placeholder="Contoh: POV ibu muda waktu balita tantrum saat HP diambil, lalu menemukan solusi 800+ cerita interaktif kurikulum Singapore di mggnura.ai..."
                className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] p-3 text-xs text-white placeholder-[#808080] focus:outline-none leading-relaxed"
              />
            </div>

            {/* Quick Parameters */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#808080]/20">
              <div>
                <label className="block text-[10px] font-bold text-[#b3b3b3] uppercase mb-1">
                  Target Durasi Video
                </label>
                <select
                  value={project.targetDuration || 30}
                  onChange={(e) => updateProject({ targetDuration: Number(e.target.value) })}
                  className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value={15}>15 Detik (Ultra Cepat)</option>
                  <option value={30}>30 Detik (Rekomendasi TikTok)</option>
                  <option value={45}>45 Detik (UGC Review Mendalam)</option>
                  <option value={60}>60 Detik (Storytelling Edukasi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#b3b3b3] uppercase mb-1">
                  Format Rasio Layar
                </label>
                <div className="bg-[#232323] border border-[#808080]/40 rounded-[4px] px-2.5 py-1.5 text-xs text-white font-bold flex items-center justify-between">
                  <span>9:16 Vertikal</span>
                  <span className="text-[10px] text-[#e50914]">TikTok / Reels</span>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateMarketingNarasi}
              disabled={isGenerating || !project.idea || project.idea.trim().length < 5}
              className="w-full netflix-btn-primary disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Merancang Naskah Hook &amp; Solusi mggnura.ai...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>GENERATE NASKAH DARI IDE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Script & Output */}
        <div className="lg:col-span-7 space-y-5">
          <div className="netflix-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#808080]/30 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center">
                  <MessageSquareText className="w-4 h-4 mr-2 text-[#e50914]" />
                  Hasil Naskah &amp; Copywriting Video
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#b3b3b3]">
                <span>{wordCount} Kata</span>
                <span>•</span>
                <span>±{estimatedSeconds} Detik Baca</span>
              </div>
            </div>

            {/* Hook 3 Detik Callout */}
            {project.hook3s && (
              <div className="mb-4 bg-[#232323] border-l-4 border-[#e50914] p-3 rounded-r-[4px]">
                <div className="flex items-center justify-between text-xs text-[#e50914] font-bold mb-1">
                  <span>Hook 3 Detik Pertama (Stop Scrolling):</span>
                </div>
                <p className="text-sm font-bold text-white leading-snug">
                  "{project.hook3s}"
                </p>
              </div>
            )}

            {/* Title & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                  Judul Video Konten
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => updateProject({ title: e.target.value })}
                  placeholder="Judul video..."
                  className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] px-3 py-2 text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#b3b3b3] uppercase mb-1">
                  Slogan Iklan
                </label>
                <input
                  type="text"
                  value={project.tagline}
                  onChange={(e) => updateProject({ tagline: e.target.value })}
                  placeholder="Headline promosi..."
                  className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] px-3 py-2 text-xs text-[#b3b3b3] focus:outline-none"
                />
              </div>
            </div>

            {/* Main Narration Voiceover Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  Naskah Voiceover (Gaya Santai &amp; Relate)
                </label>
                {project.narration && (
                  <button
                    onClick={toggleVoicePreview}
                    className="flex items-center space-x-1.5 text-xs text-[#e50914] hover:text-white font-bold transition-colors"
                  >
                    {isPlayingVoice ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Hentikan Suara</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Dengarkan Suara</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <textarea
                rows={6}
                value={project.narration}
                onChange={(e) => updateProject({ narration: e.target.value })}
                placeholder="Klik 'GENERATE NASKAH DARI IDE' untuk menghasilkan naskah otomatis..."
                className="w-full bg-[#232323] border border-[#808080]/40 focus:border-[#e50914] rounded-[4px] p-3 text-xs sm:text-sm text-white placeholder-[#808080] focus:outline-none transition-all leading-relaxed"
              />
            </div>

            {/* CTA Highlight */}
            {project.ctaText && (
              <div className="mt-3 bg-[#232323] border border-[#808080]/30 rounded-[4px] p-3 flex items-start space-x-2">
                <span className="text-base">📢</span>
                <div>
                  <span className="text-[10px] font-bold text-[#e50914] uppercase block">
                    Call To Action (CTA):
                  </span>
                  <p className="text-xs text-white font-semibold">{project.ctaText}</p>
                </div>
              </div>
            )}

            {/* Social Media Caption Box */}
            {project.captionSocialMedia && (
              <div className="mt-4 bg-[#232323] border border-[#808080]/30 rounded-[4px] p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#b3b3b3] uppercase">
                    Caption Siap Posting (TikTok / Instagram)
                  </span>
                  <button
                    onClick={handleCopyCaption}
                    className="flex items-center space-x-1 text-[11px] text-[#e50914] hover:text-white font-bold"
                  >
                    {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCaption ? 'Tersalin' : 'Salin Caption'}</span>
                  </button>
                </div>
                <p className="text-xs text-[#b3b3b3] leading-relaxed line-clamp-3">
                  {project.captionSocialMedia}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(project.targetHashtags || []).map((h, i) => (
                    <span key={i} className="text-[10px] bg-[#2d2d2d] text-[#b3b3b3] px-2 py-0.5 rounded-[2px] border border-[#808080]/20">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  playUiClick();
                  onNext();
                }}
                disabled={!project.narration || project.narration.trim().length === 0}
                className="netflix-btn-primary disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>Lanjut ke Karakter &amp; Mockup Aset</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Model Selector Section */}
      <div className="mt-8">
        <VoiceSelector
          currentConfig={project.voiceConfig}
          onChange={(newVoiceConfig) => updateProject({ voiceConfig: newVoiceConfig })}
        />
      </div>
    </div>
  );
};
