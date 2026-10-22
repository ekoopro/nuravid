import React, { useEffect, useState } from 'react';
import { Volume2, Play, Square, Check, Mic, Radio, AlertTriangle } from 'lucide-react';
import { VoiceConfig, VoiceId } from '../types';
import {
  VOICE_OPTIONS,
  DEFAULT_VOICE_CONFIG,
  speakTextWithVoice,
  stopSpeaking,
  playUiClick,
  TTS_FALLBACK_EVENT,
  getLastTtsFallback,
  TtsFallbackInfo,
} from '../utils/audio';

interface VoiceSelectorProps {
  currentConfig?: VoiceConfig;
  onChange: (config: VoiceConfig) => void;
  compact?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentConfig = DEFAULT_VOICE_CONFIG,
  onChange,
  compact = false,
}) => {
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [isTestingPronunciation, setIsTestingPronunciation] = useState(false);
  const [customTestText, setCustomTestText] = useState('Halo semuanya! Sudah coba mggnura.ai untuk stimulasi belajar anak usia dua tahun?');
  const [hasAiKey, setHasAiKey] = useState<boolean | null>(null);
  const [fallbackInfo, setFallbackInfo] = useState<TtsFallbackInfo | null>(() => getLastTtsFallback());

  // Pantau status API key + event fallback TTS (agar pengguna tahu kenapa suara seragam)
  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setHasAiKey(Boolean(data.hasGeminiKey));
      })
      .catch(() => {
        if (isMounted) setHasAiKey(null);
      });

    const onTtsFallback = (event: Event) => {
      setFallbackInfo((event as CustomEvent<TtsFallbackInfo | null>).detail ?? null);
    };
    window.addEventListener(TTS_FALLBACK_EVENT, onTtsFallback);
    return () => {
      isMounted = false;
      window.removeEventListener(TTS_FALLBACK_EVENT, onTtsFallback);
    };
  }, []);

  const handleTestVoice = (voiceId: VoiceId) => {
    const selected = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (!selected) return;

    if (testingVoiceId === voiceId) {
      stopSpeaking();
      setTestingVoiceId(null);
      return;
    }

    playUiClick();
    setTestingVoiceId(voiceId);

    const testConfig: VoiceConfig = {
      voiceId,
      voiceName: selected.name,
      style: selected.tone,
      speed: currentConfig.speed || 1.0,
      pitch: currentConfig.pitch || 1.0,
    };

    speakTextWithVoice(selected.samplePhrase, testConfig, () => {
      setTestingVoiceId(null);
    });
  };

  const handleSelectVoice = (voiceId: VoiceId) => {
    const selected = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (!selected) return;
    playUiClick();

    onChange({
      voiceId,
      voiceName: selected.name,
      style: selected.tone,
      speed: currentConfig.speed || 1.0,
      pitch: currentConfig.pitch || 1.0,
    });
  };

  const handleTestMggnuraPronunciation = () => {
    if (isTestingPronunciation) {
      stopSpeaking();
      setIsTestingPronunciation(false);
      return;
    }

    playUiClick();
    setIsTestingPronunciation(true);

    const sampleScript = 'Yuk tonton cerita edukatif anak di mggnura.ai, sekarang mggnura.ai punya delapan ratus lebih dongeng interaktif!';
    speakTextWithVoice(sampleScript, currentConfig, () => {
      setIsTestingPronunciation(false);
    });
  };

  const handleTestCustomText = () => {
    if (testingVoiceId === 'custom') {
      stopSpeaking();
      setTestingVoiceId(null);
      return;
    }

    playUiClick();
    setTestingVoiceId('custom');
    speakTextWithVoice(customTestText, currentConfig, () => {
      setTestingVoiceId(null);
    });
  };

  return (
    <div className={`netflix-card space-y-4 ${compact ? 'p-3.5' : 'p-5'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#808080]/30 pb-3">
        <div>
          <span className="text-[10px] font-bold text-[#e50914] uppercase tracking-widest block">
            Audio Voice Engine
          </span>
          <h3 className="text-base font-bold text-white flex items-center">
            <Volume2 className="w-4 h-4 mr-2 text-[#e50914]" />
            Pilih Model Suara Voiceover (Semua Model Suara Tersedia)
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-white bg-[#232323] px-2.5 py-1 rounded-[4px] border border-[#808080]/30">
            Aktif: <b className="text-[#e50914]">{currentConfig.voiceName || 'Bunda Rina (Kore)'}</b>
          </span>
        </div>
      </div>

      {/* Engine Status: jelaskan kenapa semua suara bisa terdengar sama */}
      {hasAiKey === false && (
        <div className="bg-[#e50914]/10 border border-[#e50914]/50 rounded-[4px] p-3 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-[#e50914] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#ffd7d9] leading-relaxed">
            <b className="text-white">API key Gemini belum diisi.</b> Semua model sementara memakai
            suara fallback browser sehingga terdengar seragam. Pasang API key lewat menu{' '}
            <b className="text-[#e50914]">⚙️ Settings</b> di navbar (Uji lalu Simpan) — 6 suara AI
            (Kore, Zephyr, Aoede, Puck, Fenrir, Charon) akan terdengar berbeda-beda.
          </p>
        </div>
      )}
      {hasAiKey !== false && fallbackInfo && (
        <div className="bg-[#ffd166]/10 border border-[#ffd166]/40 rounded-[4px] p-3 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-[#ffd166] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#ffe7b0] leading-relaxed">
            <b className="text-white">Gemini TTS sedang tidak dipakai.</b> {fallbackInfo.message}
          </p>
        </div>
      )}
      {hasAiKey === true && !fallbackInfo && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/40 rounded-[4px] px-3 py-2 text-[11px] text-[#10b981] flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shrink-0" />
          <span>
            <b>Gemini TTS (AI) aktif</b> — tiap model suara dibuat langsung oleh API Google.
          </span>
        </div>
      )}

      {/* Official Pronunciation Banner for mggnura.ai */}
      <div className="bg-[#232323] border border-[#808080]/30 rounded-[4px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-8 h-8 rounded-[4px] bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-[#e50914]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-[#e50914] uppercase tracking-wider">
                Ejaan Suara Resmi:
              </span>
              <span className="text-[10px] bg-[#e50914] text-white font-extrabold px-1.5 py-0.2 rounded-[2px]">
                AKTIF
              </span>
            </div>
            <p className="text-xs text-white mt-0.5">
              Setiap kata <span className="font-bold text-[#e50914]">"mggnura.ai"</span> otomatis diucapkan sebagai{' '}
              <strong className="text-white underline decoration-[#e50914] font-mono tracking-wide bg-black/40 px-1.5 py-0.5 rounded-[2px]">
                "emjijinura dot e ay"
              </strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestMggnuraPronunciation}
          className={`shrink-0 px-3.5 py-2 rounded-[4px] text-xs font-bold flex items-center space-x-1.5 transition-all shadow ${
            isTestingPronunciation
              ? 'bg-[#e50914] text-white animate-pulse'
              : 'bg-[#e50914] hover:bg-[#b80710] text-white hover:scale-102'
          }`}
        >
          {isTestingPronunciation ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Audio</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Tes Pelafalan "emjijinura dot e ay"</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Models Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white flex items-center">
            <Radio className="w-3.5 h-3.5 mr-1.5 text-[#e50914]" />
            Katalog 6 Model Karakter Suara AI Gemini
          </span>
          <span className="text-[11px] text-[#b3b3b3]">
            6 dari 6 model suara AI aktif
          </span>
        </div>

        {/* Voice Cards Grid: All 6 models */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VOICE_OPTIONS.map((voice) => {
            const isSelected = (currentConfig.voiceId || 'Kore') === voice.id;
            const isTesting = testingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => handleSelectVoice(voice.id)}
                className={`p-3.5 rounded-[4px] border cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#363636] border-[#e50914] shadow-md'
                    : 'bg-[#232323] border-[#808080]/30 hover:border-[#808080]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{voice.avatarIcon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center">
                          {voice.name}
                          {isSelected && <Check className="w-3.5 h-3.5 ml-1 text-[#e50914]" />}
                        </h4>
                        <span className="text-[10px] text-[#b3b3b3]">{voice.gender} • {voice.role}</span>
                      </div>
                    </div>

                    {voice.id === 'Kore' && (
                      <span className="text-[9px] font-bold text-[#e50914] bg-[#e50914]/15 px-1.5 py-0.5 rounded-[2px]">
                        Utama (Mom)
                      </span>
                    )}
                    {voice.id === 'Zephyr' && (
                      <span className="text-[9px] font-bold text-[#3b82f6] bg-[#3b82f6]/15 px-1.5 py-0.5 rounded-[2px]">
                        Vlog TikTok
                      </span>
                    )}
                    {voice.id === 'Aoede' && (
                      <span className="text-[9px] font-bold text-[#ec4899] bg-[#ec4899]/15 px-1.5 py-0.5 rounded-[2px]">
                        Dongeng Anak
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#b3b3b3] mt-2 line-clamp-2 leading-tight">
                    {voice.tone}
                  </p>
                  <span className="text-[10px] text-[#808080] block mt-1 line-clamp-1 italic">
                    Cocok: {voice.recommendedFor}
                  </span>
                </div>

                {/* Test Audio Button */}
                <div className="mt-3 pt-2.5 border-t border-[#808080]/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestVoice(voice.id);
                    }}
                    className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold flex items-center space-x-1 transition-colors ${
                      isTesting
                        ? 'bg-[#e50914] text-white'
                        : 'bg-[#2d2d2d] hover:bg-[#383838] text-white border border-[#808080]/30'
                    }`}
                  >
                    {isTesting ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Tes Suara</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] font-mono text-[#808080]">Gemini {voice.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Speed & Pitch Fine-Tuning */}
      <div className="pt-3 border-t border-[#808080]/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#b3b3b3] font-bold uppercase tracking-wider text-[10px]">
              Kecepatan Bicara (Speed):
            </span>
            <span className="text-[#e50914] font-black">{currentConfig.speed || 1.0}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.25"
            step="0.05"
            value={currentConfig.speed || 1.0}
            onChange={(e) =>
              onChange({
                ...currentConfig,
                speed: parseFloat(e.target.value),
              })
            }
            className="w-full accent-[#e50914] cursor-pointer bg-[#232323] h-1.5 rounded-[2px]"
          />
          <div className="flex justify-between text-[9px] text-[#808080] mt-0.5">
            <span>0.8x (Santai/Dongeng)</span>
            <span>1.0x (Normal)</span>
            <span>1.25x (Cepat TikTok)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#b3b3b3] font-bold uppercase tracking-wider text-[10px]">
              Tinggi Nada (Pitch):
            </span>
            <span className="text-[#e50914] font-black">{currentConfig.pitch || 1.0}x</span>
          </div>
          <input
            type="range"
            min="0.85"
            max="1.15"
            step="0.05"
            value={currentConfig.pitch || 1.0}
            onChange={(e) =>
              onChange({
                ...currentConfig,
                pitch: parseFloat(e.target.value),
              })
            }
            className="w-full accent-[#e50914] cursor-pointer bg-[#232323] h-1.5 rounded-[2px]"
          />
          <div className="flex justify-between text-[9px] text-[#808080] mt-0.5">
            <span>Berat / Wibawa</span>
            <span>Natural</span>
            <span>Tinggi / Ceria</span>
          </div>
        </div>
      </div>

      {/* Custom Sentence Tester */}
      <div className="pt-3 border-t border-[#808080]/30 flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          value={customTestText}
          onChange={(e) => setCustomTestText(e.target.value)}
          placeholder="Ketik kalimat untuk dites bunyinya..."
          className="flex-1 w-full bg-[#232323] border border-[#808080]/40 rounded-[4px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e50914]"
        />
        <button
          type="button"
          onClick={handleTestCustomText}
          className={`shrink-0 w-full sm:w-auto px-4 py-2 rounded-[4px] text-xs font-bold flex items-center justify-center space-x-1.5 ${
            testingVoiceId === 'custom'
              ? 'bg-[#e50914] text-white'
              : 'bg-[#232323] hover:bg-[#383838] text-white border border-[#808080]/40'
          }`}
        >
          {testingVoiceId === 'custom' ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Tes Teks Ini</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
