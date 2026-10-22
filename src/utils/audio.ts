import { VoiceId, VoiceOption, VoiceConfig } from '../types';

let audioCtx: AudioContext | null = null;
let currentAudioElement: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Helper untuk memastikan pelafalan merek "mggnura.ai" dieja secara benar: "emjijinura dot e ay"
export function formatPhoneticPronunciation(text: string): string {
  if (!text) return '';
  return text
    .replace(/mggnura\.ai/gi, 'emjijinura dot e ay')
    .replace(/mggnura/gi, 'emjijinura');
}

// 1. Available Voice Models (Gemini TTS + Web Speech Mapping) - Semua Model Suara Gemini
export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Bunda Rina (Kore)',
    role: 'Mom Creator & Parenting',
    gender: 'Wanita',
    tone: 'Hangat, Ramah, Empatik & Relatable',
    recommendedFor: 'POV Drama Orang Tua, Cerita Dongeng Balita, Relatable Parenting',
    avatarIcon: '👩‍👧',
    samplePhrase: 'Halo Moms! Jujur, relate banget kan kalau anak dua tahun susah lepas dari HP? Untung sekarang ada emjijinura dot e ay!',
  },
  {
    id: 'Zephyr',
    name: 'Kak Zephyr (Zephyr)',
    role: 'UGC Vlogger & Reviewer',
    gender: 'Wanita',
    tone: 'Ceria, Dinamis, Antusias & Penuh Energi',
    recommendedFor: 'UGC Review Aplikasi, Unboxing Fitur, Video Cepat TikTok',
    avatarIcon: '✨',
    samplePhrase: 'Guys, kalian harus tahu aplikasi edukasi satu ini! Ada 800 lebih cerita kurikulum Singapore di emjijinura dot e ay!',
  },
  {
    id: 'Aoede',
    name: 'Bunda Aoede (Aoede)',
    role: 'Storyteller & Dongeng Anak',
    gender: 'Wanita',
    tone: 'Lembut, Menenangkan, Hangat & Penuh Cerita',
    recommendedFor: 'Cerita Dongeng Balita, Bedtime Stories, Edukasi Emosional',
    avatarIcon: '🌸',
    samplePhrase: 'Halo Bunda dan si kecil! Dengarkan kisah penuh keajaiban dari emjijinura dot e ay sebelum tidur ya.',
  },
  {
    id: 'Puck',
    name: 'Papa Dimas (Puck)',
    role: 'Dad Creator / Ayah Balita',
    gender: 'Pria',
    tone: 'Santai, Kasual, Modern & Bersahabat',
    recommendedFor: 'POV Ayah Mengasuh, Solusi Praktis Keluarga, Video Santai',
    avatarIcon: '👨‍👦',
    samplePhrase: 'Sebagai ayah pekerja, saya pengen stimulasi anak yang berbobot tapi praktis. emjijinura dot e ay ini solusinya!',
  },
  {
    id: 'Fenrir',
    name: 'Dokter Arga (Fenrir)',
    role: 'Edukasi Ahli & Dokter Anak',
    gender: 'Pria',
    tone: 'Berwibawa, Profesional, Jelas & Terpercaya',
    recommendedFor: 'Edukasi Parenting Ilmiah, Tips Stimulasi Golden Age, Soft-Selling Edukasi',
    avatarIcon: '👨‍⚕️',
    samplePhrase: 'Usia 2 hingga 3 tahun adalah masa emas perkembangan otak anak. Hindari tontonan pasif berlebih dengan stimulasi interaktif bersama emjijinura dot e ay.',
  },
  {
    id: 'Charon',
    name: 'Om Charon (Charon)',
    role: 'Narator Tenang & Bijak',
    gender: 'Pria',
    tone: 'Tenang, Teduh, Mengayomi & Lembut',
    recommendedFor: 'Bedtime Stories (Cerita Sebelum Tidur), Edukasi Emosi Anak',
    avatarIcon: '🌙',
    samplePhrase: 'Saat malam tiba, dengarkan kisah penuh nilai kebaikan bersama emjijinura dot e ay agar tidur si kecil lebih nyenyak.',
  },
];

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceId: 'Kore',
  voiceName: 'Bunda Rina (Kore)',
  style: 'Warm, natural Indonesian mom creator, friendly and conversational',
  speed: 1.0,
  pitch: 1.0,
};

// ---- Status engine TTS (memberi tahu UI saat Gemini TTS tidak dipakai) ----
export type TtsFallbackReason =
  | 'NO_API_KEY'
  | 'TTS_FAILED'
  | 'NO_AUDIO'
  | 'NETWORK'
  | 'AUDIO_ERROR'
  | 'UNKNOWN';

export interface TtsFallbackInfo {
  reason: TtsFallbackReason;
  message: string;
  at: number;
}

export const TTS_FALLBACK_EVENT = 'nura:tts-fallback';

let lastTtsFallback: TtsFallbackInfo | null = null;

export function getLastTtsFallback(): TtsFallbackInfo | null {
  return lastTtsFallback;
}

function reportTtsFallback(reason: TtsFallbackReason, message: string): void {
  lastTtsFallback = { reason, message, at: Date.now() };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TTS_FALLBACK_EVENT, { detail: lastTtsFallback }));
  }
}

function reportTtsEngineActive(): void {
  lastTtsFallback = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TTS_FALLBACK_EVENT, { detail: null }));
  }
}

// 2. Iconic Netflix-style "Tu-Dum" intro sonic branding
export function playNetflixTudum(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    gain1.gain.setValueAtTime(0.8, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    const t2 = now + 0.22;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(90, t2);
    osc2.frequency.exponentialRampToValueAtTime(28, t2 + 1.2);

    gain2.gain.setValueAtTime(0.9, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 1.8);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 1.8);

    [220, 277.18, 329.63, 440].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t2 + 0.1);
      gain.gain.setValueAtTime(0.12, t2 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t2 + 2.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t2 + 0.1);
      osc.stop(t2 + 2.0);
    });
  } catch {}
}

export function playUiClick(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.06);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch {}
}

export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.09;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch {}
}

// 3. Play audio text using selected Voice Model (with backend Gemini TTS priority + Web Speech fallback)
export async function speakTextWithVoice(
  text: string,
  voiceConfig: VoiceConfig = DEFAULT_VOICE_CONFIG,
  onEnd?: () => void
): Promise<void> {
  stopSpeaking();

  // Pastikan ejaan mggnura.ai diucapkan "emjijinura dot e ay"
  const phoneticText = formatPhoneticPronunciation(text);

  // Try Gemini TTS first
  try {
    const response = await fetch('/api/generate-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: phoneticText,
        voice: voiceConfig.voiceId,
        style: voiceConfig.style,
      }),
    });

    const resData = await response.json();
    if (resData.success && resData.audioDataUrl) {
      const audio = new Audio(resData.audioDataUrl);
      currentAudioElement = audio;
      audio.playbackRate = voiceConfig.speed || 1.0;
      audio.onended = () => {
        currentAudioElement = null;
        onEnd?.();
      };
      audio.onerror = () => {
        currentAudioElement = null;
        reportTtsFallback('AUDIO_ERROR', 'Audio Gemini tidak dapat diputar — memakai suara fallback browser.');
        speakWebSpeechFallback(phoneticText, voiceConfig, onEnd);
      };
      await audio.play();
      reportTtsEngineActive();
      return;
    }

    // Server merespons, tetapi TTS Gemini tidak dipakai (key belum diisi / kuota habis / dsb.)
    reportTtsFallback(
      (resData.reason || 'TTS_FAILED') as TtsFallbackReason,
      resData.message || 'Gemini TTS tidak tersedia — memakai suara fallback browser.'
    );
  } catch (err: any) {
    console.warn('TTS server request fallback to Web Speech:', err);
    reportTtsFallback(
      'NETWORK',
      `Server TTS tidak terjangkau (${err?.message || 'network error'}) — memakai suara fallback browser.`
    );
  }

  // Fallback to Web Speech API
  speakWebSpeechFallback(phoneticText, voiceConfig, onEnd);
}

// Profil fallback Web Speech per model: nada & tempo BERBEDA untuk tiap pilihan,
// supaya walaupun memakai suara browser yang terbatas, tiap model tetap terasa beda.
const WEB_SPEECH_PROFILES: Record<VoiceId, { pitch: number; rate: number; gender: 'Wanita' | 'Pria' }> = {
  Kore: { pitch: 1.08, rate: 1.0, gender: 'Wanita' },
  Zephyr: { pitch: 1.18, rate: 1.08, gender: 'Wanita' },
  Aoede: { pitch: 0.97, rate: 0.92, gender: 'Wanita' },
  Puck: { pitch: 0.86, rate: 1.03, gender: 'Pria' },
  Fenrir: { pitch: 0.72, rate: 0.96, gender: 'Pria' },
  Charon: { pitch: 0.78, rate: 0.87, gender: 'Pria' },
};

function matchesVoiceGender(name: string, gender: 'Wanita' | 'Pria'): boolean {
  const lower = name.toLowerCase();
  if (gender === 'Wanita') {
    return ['gadis', 'female', 'woman', 'wanita', 'google bahasa indonesia'].some((hint) =>
      lower.includes(hint)
    );
  }
  // Hati-hati: "female" mengandung "male" — pakai word boundary
  return ['ganteng', 'pria'].some((hint) => lower.includes(hint)) || /\bmale\b/.test(lower) || /\bman\b/.test(lower);
}

// Pilih voice browser yang BERBEDA antar model: cocokkan gender dulu, lalu sebar indeks
function pickWebSpeechVoice(
  gender: 'Wanita' | 'Pria',
  salt: number
): SpeechSynthesisVoice | undefined {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return undefined;
    const idVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('id'));
    const base = idVoices.length > 0 ? idVoices : voices;
    const matched = base.filter((v) => matchesVoiceGender(v.name, gender));
    const pool = matched.length > 0 ? matched : base;
    return pool[salt % pool.length];
  } catch {
    return undefined;
  }
}

function clampSpeechValue(value: number): number {
  return Math.min(2, Math.max(0.1, value));
}

function speakWebSpeechFallback(
  text: string,
  voiceConfig: VoiceConfig,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  // Ensure pronunciation replacement
  const phoneticText = formatPhoneticPronunciation(text);
  const utterance = new SpeechSynthesisUtterance(phoneticText);
  utterance.lang = 'id-ID';

  const profile = WEB_SPEECH_PROFILES[voiceConfig.voiceId] || WEB_SPEECH_PROFILES.Kore;
  utterance.rate = clampSpeechValue(profile.rate * (voiceConfig.speed || 1.0) * 0.98);
  utterance.pitch = clampSpeechValue(profile.pitch * (voiceConfig.pitch || 1.0));

  const salt = Math.max(0, VOICE_OPTIONS.findIndex((option) => option.id === voiceConfig.voiceId));
  const pickedVoice = pickWebSpeechVoice(profile.gender, salt);
  if (pickedVoice) utterance.voice = pickedVoice;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function speakText(text: string, lang = 'id-ID', onEnd?: () => void): void {
  speakTextWithVoice(text, DEFAULT_VOICE_CONFIG, onEnd);
}

export function stopSpeaking(): void {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
