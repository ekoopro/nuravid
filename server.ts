import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---- AI Provider Settings (bisa diubah lewat menu Settings, tanpa restart) ----
interface AiProviderMeta {
  id: string; // Nama variabel env = kunci input di frontend
  label: string;
  required: boolean;
  purpose: string; // Fitur aplikasi yang memakai API ini
  docsUrl: string; // Tempat mendapatkan API key
}

// Daftar API AI yang DIBUTUHKAN aplikasi ini.
// Untuk menambah provider baru: tambahkan entri di sini, lalu pakai
// `createAiClient(providerId, key)` pada endpoint yang relevan.
const AI_PROVIDERS: AiProviderMeta[] = [
  {
    id: 'GEMINI_API_KEY',
    label: 'Google Gemini API Key',
    required: true,
    purpose: 'Naskah & caption AI, gambar aset/storyboard, dan voiceover TTS (model Gemini)',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
];

const ENV_FILE = path.resolve(__dirname, '.env');

function getProviderValue(id: string): string {
  return (process.env[id] || '').trim();
}

function maskKey(value: string): string | null {
  if (!value) return null;
  if (value.length <= 8) return '•'.repeat(value.length);
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(value.length - 8, 24))}${value.slice(-4)}`;
}

function createAiClient(key?: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: (key || getProviderValue('GEMINI_API_KEY')).trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Klien AI dibuat ulang setiap kali key disimpan lewat POST /api/settings
let ai = createAiClient();

function readEnvFile(): string[] {
  try {
    return fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/);
  } catch {
    return [];
  }
}

// Tulis/hapus satu variabel di file .env (komentar & entri lain tetap aman)
function upsertEnvVar(id: string, value: string | null): void {
  const pattern = new RegExp(`^\\s*${id}\\s*=`);
  const lines = readEnvFile().filter((line) => !pattern.test(line));
  if (value !== null) {
    lines.push(`${id}="${value.replace(/"/g, '\\"')}"`);
  }
  const cleaned = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  fs.writeFileSync(ENV_FILE, cleaned ? `${cleaned}\n` : '', 'utf8');
}

// Helper for high-quality SVG poster in 9:16 vertical or 16:9
function generateMarketingPosterSvg(
  prompt: string,
  type: 'character' | 'background' | 'object' | 'scene',
  style = 'Real Smartphone UGC Vlog',
  aspectRatio = '9:16'
): string {
  const isVertical = aspectRatio === '9:16';
  const width = isVertical ? 720 : 1280;
  const height = isVertical ? 1280 : 720;

  const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = (hash * 17) % 360;

  const title = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="warmBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E1715" />
        <stop offset="40%" stop-color="#141414" />
        <stop offset="100%" stop-color="#241B19" />
      </linearGradient>
      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E50914" />
        <stop offset="100%" stop-color="#FF5A5F" />
      </linearGradient>
      <radialGradient id="phoneGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(16, 185, 129, 0.25)" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>
    </defs>

    <!-- Background Canvas -->
    <rect width="${width}" height="${height}" fill="url(#warmBg)" />

    <!-- Ambient Glow Circle -->
    <circle cx="${width / 2}" cy="${height / 2}" r="${width * 0.4}" fill="url(#phoneGlow)" />

    ${isVertical ? `
      <!-- 9:16 Smartphone Mockup Frame in center -->
      <g transform="translate(${width / 2 - 190}, ${height / 2 - 320})">
        <!-- Phone Outer Body -->
        <rect width="380" height="640" rx="44" fill="#0D0D0D" stroke="#333333" stroke-width="4" />
        <rect x="8" y="8" width="364" height="624" rx="38" fill="#181818" />
        
        <!-- Camera Island Pill -->
        <rect x="130" y="18" width="120" height="24" rx="12" fill="#000000" />
        <circle cx="225" cy="30" r="5" fill="#1a1a1a" stroke="#333" stroke-width="1" />

        <!-- mggnura.ai Screen App Header -->
        <rect x="24" y="60" width="332" height="48" rx="12" fill="#222222" />
        <text x="44" y="90" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="#10B981">mggnura.ai</text>
        <text x="140" y="90" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="12" fill="#AAAAAA">800+ Cerita Anak</text>

        <!-- Story Book Thumbnail Cards inside Phone -->
        <rect x="24" y="120" width="160" height="200" rx="16" fill="hsl(${hue}, 60%, 25%)" stroke="rgba(255,255,255,0.1)" />
        <text x="40" y="270" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="13" fill="#FFFFFF">Kancil &amp; Bintang</text>
        <text x="40" y="290" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="10" fill="#10B981">Usia 2-3 Tahun</text>

        <rect x="196" y="120" width="160" height="200" rx="16" fill="hsl(${(hue + 60) % 360}, 50%, 22%)" stroke="rgba(255,255,255,0.1)" />
        <text x="212" y="270" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="13" fill="#FFFFFF">Dino Belajar Sikat Gigi</text>
        <text x="212" y="290" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="10" fill="#10B981">Domain Emosi</text>

        <!-- AI Coaching Audio Waveform Strip -->
        <rect x="24" y="335" width="332" height="64" rx="14" fill="#252525" />
        <circle cx="56" cy="367" r="16" fill="#10B981" />
        <polygon points="52,360 64,367 52,374" fill="#FFFFFF" />
        <text x="84" y="362" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="12" fill="#FFFFFF">Audio Coaching Bunda</text>
        <text x="84" y="380" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="10" fill="#AAAAAA">Kurikulum Singapore NEL</text>

        <!-- Bottom CTA Button inside phone -->
        <rect x="24" y="420" width="332" height="46" rx="23" fill="url(#primaryGrad)" />
        <text x="110" y="449" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">COBA GRATIS 7 HARI</text>
      </g>
    ` : `
      <!-- 16:9 Landscape Layout -->
      <rect x="140" y="100" width="1000" height="520" rx="24" fill="#181818" stroke="#333" stroke-width="2" />
      <text x="200" y="220" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="32" fill="#10B981">mggnura.ai</text>
      <text x="200" y="260" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="18" fill="#FFFFFF">Aplikasi Belajar &amp; 800+ Cerita Balita 2-3 Tahun</text>
    `}

    <!-- TikTok/Reels Style On-Screen Text Banner (Top) -->
    <g transform="translate(${width / 2}, ${isVertical ? 120 : 60})">
      <rect x="-240" y="-24" width="480" height="48" rx="8" fill="rgba(0,0,0,0.8)" stroke="#E50914" stroke-width="2" />
      <text x="0" y="8" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="${isVertical ? 16 : 18}" fill="#FFE600" text-anchor="middle" letter-spacing="0.5">
        POVs &amp; UGC • MGGNURA.AI CONVERSION
      </text>
    </g>

    <!-- Bottom Marketing Caption Bar -->
    <g transform="translate(40, ${height - (isVertical ? 100 : 70)})">
      <rect x="0" y="0" width="${width - 80}" height="${isVertical ? 70 : 50}" rx="12" fill="rgba(20,20,20,0.85)" stroke="#333" stroke-width="1" />
      <text x="20" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="${isVertical ? 13 : 14}" fill="#FFFFFF">${title}</text>
      <text x="20" y="52" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="${isVertical ? 11 : 12}" fill="#10B981">HOOK (3s) ➔ PROBLEM ➔ SOLUSI MGGNURA.AI ➔ CTA</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(getProviderValue('GEMINI_API_KEY')),
    appName: 'NURA VID',
    specialization: 'mggnura.ai Video Marketing Factory',
    version: '2.0.0',
  });
});

// 1a. Ringkasan pengaturan API AI (daftar provider + status, key di-mask)
function buildSettingsPayload() {
  return {
    envFile: '.env',
    providers: AI_PROVIDERS.map((provider) => {
      const value = getProviderValue(provider.id);
      return {
        ...provider,
        configured: Boolean(value),
        maskedValue: maskKey(value),
      };
    }),
  };
}

// GET /api/settings -> baca status API AI yang dibutuhkan
app.get('/api/settings', (req, res) => {
  res.json({ success: true, ...buildSettingsPayload() });
});

// POST /api/settings -> simpan API key (langsung aktif + ditulis ke file .env)
app.post('/api/settings', (req, res) => {
  try {
    const body = req.body || {};
    const unknownKeys = Object.keys(body).filter(
      (key) => !AI_PROVIDERS.some((provider) => provider.id === key)
    );
    if (unknownKeys.length > 0) {
      return res.status(400).json({ error: `Pengaturan tidak dikenal: ${unknownKeys.join(', ')}` });
    }

    for (const provider of AI_PROVIDERS) {
      if (!(provider.id in body)) continue;
      const raw = body[provider.id];
      if (raw !== null && typeof raw !== 'string') {
        return res.status(400).json({ error: `${provider.id} harus berupa teks.` });
      }

      // Nilai placeholder bawaan .env.example dianggap kosong
      const normalized = (raw || '').trim() === `MY_${provider.id}` ? '' : (raw || '').trim();

      if (normalized) {
        process.env[provider.id] = normalized;
      } else {
        delete process.env[provider.id];
      }
      upsertEnvVar(provider.id, normalized || null);
    }

    // Bangun ulang klien AI agar key baru langsung dipakai tanpa restart
    ai = createAiClient();

    const hasRequiredKey = AI_PROVIDERS.every(
      (provider) => !provider.required || Boolean(getProviderValue(provider.id))
    );

    return res.json({
      success: true,
      message: 'Pengaturan API AI tersimpan.',
      hasRequiredKey,
      ...buildSettingsPayload(),
    });
  } catch (error: any) {
    console.error('Error saving AI settings:', error);
    return res.status(500).json({ error: error?.message || 'Gagal menyimpan pengaturan API AI.' });
  }
});

// POST /api/settings/test -> uji koneksi ke provider (pakai key draft, atau key tersimpan)
app.post('/api/settings/test', async (req, res) => {
  try {
    const { id = 'GEMINI_API_KEY', key } = req.body || {};
    const provider = AI_PROVIDERS.find((item) => item.id === id);
    if (!provider) {
      return res.status(400).json({ success: false, message: `API tidak dikenal: ${id}` });
    }

    const candidate =
      (typeof key === 'string' && key.trim()) || getProviderValue(provider.id) || '';
    if (!candidate || candidate === `MY_${provider.id}`) {
      return res.json({
        success: false,
        message: `${provider.label} belum diisi. Tempel API key lalu coba lagi.`,
      });
    }

    const startedAt = Date.now();
    const testClient = createAiClient(candidate);
    const response = await testClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Balas hanya dengan teks: OK',
      config: { maxOutputTokens: 16 },
    });
    const latencyMs = Date.now() - startedAt;
    const reply = (response.text || '').trim();

    return res.json({
      success: Boolean(reply),
      latencyMs,
      message: reply
        ? `Koneksi berhasil (${latencyMs} ms) — model membalas: "${reply.slice(0, 40)}".`
        : 'Koneksi terbuka, tetapi model tidak mengembalikan teks. Cek izin API key Anda.',
    });
  } catch (error: any) {
    console.warn('AI settings connection test failed:', error?.message);
    let message = error?.message || 'Koneksi ke provider AI gagal. Cek API key Anda.';
    try {
      // SDK bisa mengembalikan pesan berupa string JSON — ambil bagian manusianya saja
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) message = String(parsed.error.message);
    } catch {
      // pesan bukan JSON, gunakan apa adanya
    }
    return res.json({
      success: false,
      message,
    });
  }
});

// 2. Generate Marketing Narration & Copywriting (Direct-Response UGC & POV)
app.post('/api/generate-narasi', async (req, res) => {
  try {
    const {
      idea,
      marketingFormat = 'POV Drama Relatable',
      targetPainPoint = 'Anak kecanduan gadget & screen time pasif',
      targetDuration = 30,
      language = 'Indonesian',
      audience = 'Orang Tua / Ibu Muda (Usia Anak 2-3 Tahun)',
    } = req.body;

    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ error: 'Ide atau topik video harus diisi.' });
    }

    const systemInstruction = `Kamu adalah Pakar Direct-Response Marketing dan Viral Video Creator (TikTok/Reels/Shorts) untuk produk mggnura.ai.
mggnura.ai (secara audio voiceover dilafalkan sebagai: "emjijinura dot e ay") adalah aplikasi edukasi & 800+ cerita interaktif untuk anak usia 2-3 tahun, dilengkapi AI parenting coaching berbasis kurikulum Singapore Nurturing Early Learners (NEL), mendukung 8 domain belajar, bebas screen time pasif berlebih, dan bilingual (Indonesia & Inggris).

PANDUAN EJAAN & BRANDING:
- Di dalam naskah tertulis, caption, on-screen text, dan prompt: TETAP tuliskan nama resminya "mggnura.ai" atau "mggnura" agar branding di layar tampil profesional.
- Mesin voiceover studio kami sudah dikonfigurasi untuk melafalkannya secara presisi sebagai "emjijinura dot e ay" saat diucapkan.

PENTING (TIDAK BOLEH BERGAYA FILM FIKSI/BIOSKOP DRAMATIS):
- Jangan gunakan bahasa puisi kaku, thriller fiksi, atau monolog bioskop.
- Gunakan bahasa sehari-hari yang sangat relate bagi ibu/ayah muda Indonesia (seperti: "Bunda", "Moms", "relate banget", "pusing anak tantrum", "untung nemu mggnura.ai").
- Wajib ikuti FORMULA DIRECT RESPONSE 30 DETIK:
  1. Hook (3 detik pertama): Pertanyaan mengejutkan, visual hook, atau kalimat yang bikin jempol berhenti scrolling.
  2. Problem & Agitasi: Keluhan nyata orang tua (anak kecanduan nonton YouTube melotot, speech delay, orang tua lelah cari cara ngajarin).
  3. Solusi mggnura.ai: Tunjukkan fitur nyata mggnura.ai (800+ cerita berbobot kurikulum Singapore, anak diajak interaksi aktif, bukan cuma nonton pasif).
  4. Transformasi: Anak jadi ceria, kosakata nambah, tidur lebih nyenyak.
  5. Call To Action (CTA): Ajakan kuat klik link di bio untuk coba gratis 7 hari.`;

    const prompt = `Ide / Konsep Konten: "${idea}"
Format Pilihan: ${marketingFormat}
Titik Masalah (Pain Point): ${targetPainPoint}
Target Audiens: ${audience}
Target Durasi: ${targetDuration} detik

Hasilkan naskah marketing lengkap, hook 3 detik, skrip narasi voiceover yang siap dibacakan, teks caption on-screen per beat, caption media sosial + hashtag, serta rekomendasi aset karakter (Mom Creator / Balita), background rumah ramah anak, dan objek (Smartphone layar mggnura.ai).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Judul konsep konten video (e.g. POV: Balita 2 Tahun Gak Mau Lepas HP)' },
            tagline: { type: Type.STRING, description: 'Slogan hook singkat (e.g. Solusi Screen Time Pintar Anak 2-3 Tahun)' },
            hook3s: { type: Type.STRING, description: 'Kalimat pembuka 3 detik pertama yang bikin orang tua berhenti scrolling' },
            problemAgitation: { type: Type.STRING, description: 'Bagian naskah yang membidik kecemasan orang tua' },
            mggnuraSolution: { type: Type.STRING, description: 'Bagian naskah yang mendemonstrasikan keunggulan mggnura.ai' },
            ctaText: { type: Type.STRING, description: 'Kalimat Call To Action di akhir (e.g. Klik link di bio buat coba gratis 7 hari)' },
            narration: { type: Type.STRING, description: 'Naskah voiceover utuh yang siap dibacakan (30-60 detik santai & persuasif)' },
            captionSocialMedia: { type: Type.STRING, description: 'Caption lengkap untuk posting di TikTok / Instagram Reels' },
            targetHashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Hashtag relevan seperti #ParentingIndonesia #BalitaPintar #mggnura' },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: 'Nama tokoh e.g. Bunda Rina / Adik Kano' },
                  role: { type: Type.STRING, description: 'Peran e.g. Mom Creator / Balita 2.5 Tahun' },
                  visualDescription: { type: Type.STRING, description: 'Deskripsi visual natural (bukan fiksi)' },
                },
                required: ['id', 'name', 'role', 'visualDescription'],
              },
            },
            backgrounds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: 'Lokasi rumah e.g. Ruang Tamu Hangat Minimalis' },
                  timeOfDay: { type: Type.STRING },
                  visualDescription: { type: Type.STRING },
                },
                required: ['id', 'name', 'timeOfDay', 'visualDescription'],
              },
            },
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: 'Benda e.g. Smartphone Layar mggnura.ai' },
                  significance: { type: Type.STRING },
                  visualDescription: { type: Type.STRING },
                },
                required: ['id', 'name', 'significance', 'visualDescription'],
              },
            },
          },
          required: ['title', 'tagline', 'hook3s', 'narration', 'ctaText', 'characters', 'backgrounds', 'objects'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating marketing narration:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal menghasilkan naskah marketing mggnura.ai.',
    });
  }
});

// 3. Generate 9:16 Marketing Storyboard (Auto Scene Detection with Hook -> CTA beats)
app.post('/api/generate-storyboard', async (req, res) => {
  try {
    const {
      title,
      narration,
      idea,
      characters = [],
      backgrounds = [],
      objects = [],
      visualStyle = 'Real Smartphone UGC Vlog',
      preferredSceneCount,
    } = req.body;

    if (!narration && !idea) {
      return res.status(400).json({ error: 'Naskah atau ide harus disertakan untuk menyusun storyboard.' });
    }

    const systemInstruction = `Kamu adalah Director & Video Strategist untuk konten vertikal 9:16 TikTok/Reels mggnura.ai.
Bagi naskah ke dalam potongan adegan (scene) berorientasi konversi penjualan:
- JIKA user tidak menentukan jumlah scene, secara OTOMATIS tentukan 4 sampai 6 scene optimal sesuai formula video TikTok/Reels:
  * Beat 1: Hook 3 Detik (Stop Scrolling)
  * Beat 2: Problem & Agitasi Relate
  * Beat 3: Solusi mggnura.ai (Screen Demo / Unboxing)
  * Beat 4: Transformasi & Bukti (Anak Ceria & Belajar Aktif)
  * Beat 5: Strong Call To Action (CTA Promo)
Setiap scene harus memiliki:
- sceneNumber
- sceneTitle
- marketingBeat
- durationSeconds (biasanya 3 - 7 detik per scene)
- narrationSegment (kalimat santai voiceover)
- onScreenText (teks pop-up tebal gaya TikTok di layar, misal: "ANAK TANTRUM KALO GAK NONTON HP?!")
- visualDescription (arahan visual video vertikal 9:16)
- cameraMovement ('Handheld Phone Vlog', 'Slow Zoom In', 'Close-Up Screen Tap', 'Over-The-Shoulder POV', 'Low Angle Toddler Eye-Level')
- characterNames
- backgroundSetting
- soundEffectCue (e.g. "Suara notifikasi HP, tawa balita, chime ceria")
- transition`;

    const prompt = `Judul: ${title || 'Konten Video mggnura.ai'}
Naskah Penuh:
"${narration}"

Konsep Awal: "${idea}"
Aset:
- Karakter: ${JSON.stringify(characters.map((c: any) => ({ name: c.name, role: c.role })))}
- Background: ${JSON.stringify(backgrounds.map((b: any) => ({ name: b.name })))}
- Objek: ${JSON.stringify(objects.map((o: any) => ({ name: o.name })))}
- Gaya: ${visualStyle}
${preferredSceneCount && Number(preferredSceneCount) > 0 ? `- Permintaan jumlah scene khusus: ${preferredSceneCount} scene` : '- Mode Otomatis: Tentukan jumlah scene terbaik untuk konversi TikTok 9:16'}

Susun storyboard penjualan mggnura.ai dalam format JSON. Jelaskan alasan pemilihan pacing di pacingReason.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalScenes: { type: Type.INTEGER },
            pacingReason: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  sceneTitle: { type: Type.STRING },
                  marketingBeat: { type: Type.STRING },
                  durationSeconds: { type: Type.INTEGER },
                  narrationSegment: { type: Type.STRING },
                  onScreenText: { type: Type.STRING, description: 'Teks singkat tebal pop-up di layar khas TikTok' },
                  visualDescription: { type: Type.STRING },
                  cameraMovement: { type: Type.STRING },
                  characterNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                  backgroundSetting: { type: Type.STRING },
                  soundEffectCue: { type: Type.STRING },
                  transition: { type: Type.STRING },
                },
                required: ['sceneNumber', 'sceneTitle', 'durationSeconds', 'narrationSegment', 'onScreenText', 'visualDescription', 'cameraMovement', 'soundEffectCue', 'transition'],
              },
            },
          },
          required: ['totalScenes', 'pacingReason', 'scenes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating marketing storyboard:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal menyusun storyboard vertikal.',
    });
  }
});

// 4. Regenerate Single Marketing Scene
app.post('/api/regenerate-scene', async (req, res) => {
  try {
    const { scene, instructions, storyContext } = req.body;
    if (!scene) {
      return res.status(400).json({ error: 'Data scene harus disertakan.' });
    }

    const prompt = `Konteks Video Pemasaran mggnura.ai: ${storyContext || 'UGC Video Vertikal 9:16'}
Scene Saat Ini:
${JSON.stringify(scene, null, 2)}

Arahan Perubahan dari Pengguna:
"${instructions || 'Buat hook lebih nendang dan on-screen text lebih menarik perhatian orang tua'}"

Hasilkan scene revisi yang disesuaikan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            sceneTitle: { type: Type.STRING },
            marketingBeat: { type: Type.STRING },
            durationSeconds: { type: Type.INTEGER },
            narrationSegment: { type: Type.STRING },
            onScreenText: { type: Type.STRING },
            visualDescription: { type: Type.STRING },
            cameraMovement: { type: Type.STRING },
            characterNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            backgroundSetting: { type: Type.STRING },
            soundEffectCue: { type: Type.STRING },
            transition: { type: Type.STRING },
          },
          required: ['sceneNumber', 'sceneTitle', 'durationSeconds', 'narrationSegment', 'onScreenText', 'visualDescription', 'cameraMovement', 'soundEffectCue', 'transition'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, scene: parsed });
  } catch (error: any) {
    console.error('Error regenerating marketing scene:', error);
    return res.status(500).json({ error: error?.message || 'Gagal regenerasi scene.' });
  }
});

// 5. Generate Visual Image (9:16 Vertikal by default)
app.post('/api/generate-visual', async (req, res) => {
  try {
    const { prompt, type = 'scene', style = 'Real Smartphone UGC Vlog', aspectRatio = '9:16' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt visual harus diisi.' });
    }

    const fullPrompt = `${prompt}, ${style}, natural lighting, authentic Indonesian parenting lifestyle, shot on modern smartphone 4k, crisp focus, vibrant and warm`;

    // Attempt Gemini Image Generation
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio === '9:16' || aspectRatio === '16:9') ? aspectRatio : '9:16',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return res.json({
            success: true,
            imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
            isAiGenerated: true,
          });
        }
      }
    } catch (err: any) {
      console.warn('Gemini image model fallback:', err?.message);
    }

    // High fidelity SVG fallback in 9:16
    const svgUrl = generateMarketingPosterSvg(prompt, type as any, style, aspectRatio);
    return res.json({
      success: true,
      imageUrl: svgUrl,
      isAiGenerated: false,
      note: 'Menggunakan visual mggnura.ai Creative Studio renderer.',
    });
  } catch (error: any) {
    console.error('Error in marketing visual generation:', error);
    return res.status(500).json({ error: error?.message || 'Gagal membuat visual.' });
  }
});

// Helper untuk ejaan fonetik merek mggnura.ai
function formatPhoneticPronunciation(text: string): string {
  if (!text) return '';
  return text
    .replace(/mggnura\.ai/gi, 'emjijinura dot e ay')
    .replace(/mggnura/gi, 'emjijinura');
}

// 6. Generate Voiceover TTS (Audio)
const TTS_VOICE_IDS = ['Kore', 'Zephyr', 'Aoede', 'Puck', 'Fenrir', 'Charon'];

// SDK kadang mengembalikan pesan error berupa string JSON — rapikan untuk UI
function humanizeApiError(raw: unknown): string {
  const message =
    typeof raw === 'string' ? raw : String((raw as any)?.message || raw || 'Unknown error');
  try {
    const parsed = JSON.parse(message);
    if (parsed?.error?.message) return String(parsed.error.message);
  } catch {
    // bukan JSON, pakai apa adanya
  }
  return message;
}

app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text, voice, style = 'Friendly, warm, conversational mom creator' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Teks narasi harus diisi.' });
    }

    // Hanya 6 voice resmi Gemini yang boleh dikirim (lainnya fallback aman ke Kore)
    const selectedVoice = TTS_VOICE_IDS.includes(voice) ? voice : 'Kore';
    const spokenText = formatPhoneticPronunciation(text);

    // Fast-path: tanpa API key, jangan panggil API — langsung minta client fallback
    if (!getProviderValue('GEMINI_API_KEY')) {
      return res.json({
        success: false,
        useClientFallback: true,
        reason: 'NO_API_KEY',
        voice: selectedVoice,
        message:
          'API key Gemini belum diisi — pasang lewat menu ⚙️ Settings agar 6 model suara AI terdengar berbeda.',
      });
    }

    let failure: { reason: string; message: string } | null = null;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: spokenText, speechMetadata: { style } }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          success: true,
          engine: 'gemini',
          voice: selectedVoice,
          audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
        });
      }
      failure = {
        reason: 'NO_AUDIO',
        message: 'Gemini tidak mengembalikan audio untuk voice ini.',
      };
    } catch (ttsErr: any) {
      console.warn('Gemini TTS fallback:', ttsErr?.message);
      failure = { reason: 'TTS_FAILED', message: humanizeApiError(ttsErr) };
    }

    return res.json({
      success: false,
      useClientFallback: true,
      voice: selectedVoice,
      ...failure,
      hint: 'Memakai suara fallback browser (terbatas & cenderung seragam antar model).',
    });
  } catch (error: any) {
    console.error('Error in TTS:', error);
    return res.status(500).json({ error: error?.message || 'Gagal memproses suara.' });
  }
});

// 7. AI IMAGE-TO-VIDEO (Google Veo) — menghasilkan MP4 sungguhan dari satu gambar (ala Google Flow)
const VEO_MODEL_CANDIDATES = [
  process.env.VEO_MODEL || '',
  'veo-3.0-fast-generate-preview',
  'veo-3.0-generate-preview',
  'veo-2.0-generate-001',
].filter(Boolean);

async function fetchRemoteImage(url: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    const mimeType = (response.headers.get('content-type') || 'image/jpeg').split(';')[0];
    return { bytes, mimeType };
  } catch {
    return null;
  }
}

function parseImageInput(
  imageUrl: string
): { imageBytes: string; mimeType: string } | { error: string; code?: string } {
  if (imageUrl.startsWith('data:')) {
    const headerEnd = imageUrl.indexOf(',');
    if (headerEnd < 0) return { error: 'Format data URL gambar tidak valid.' };
    const header = imageUrl.slice(5, headerEnd); // bagian setelah "data:"
    const payload = imageUrl.slice(headerEnd + 1);
    const mimeType = (header.split(';')[0] || '').trim().toLowerCase();
    const isBase64 = /;base64/i.test(header);

    if (mimeType === 'image/svg+xml') {
      return {
        error: 'SVG tidak didukung Veo — kirim PNG/JPEG hasil rasterisasi dari browser.',
        code: 'SVG_NOT_SUPPORTED',
      };
    }
    const base64 = isBase64
      ? payload
      : Buffer.from(decodeURIComponent(payload), 'utf8').toString('base64');
    return { imageBytes: base64, mimeType: mimeType || 'image/jpeg' };
  }
  return { error: 'imageUrl harus berupa data URL (PNG/JPEG) atau URL http(s).' };
}

// POST /api/generate-video -> Google Veo image-to-video: satu gambar jadi video MP4 sungguhan
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, imageUrl, aspectRatio = '9:16', durationSeconds } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt wajib diisi.' });
    }
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'imageUrl wajib diisi.' });
    }
    if (!getProviderValue('GEMINI_API_KEY')) {
      return res.status(400).json({
        error: 'API key Gemini belum diisi — pasang lewat menu ⚙️ Settings untuk memakai Veo.',
      });
    }

    // Siapkan bytes gambar (data URL PNG/JPEG dari browser, atau URL remote)
    let imageBytes = '';
    let mimeType = 'image/jpeg';
    if (imageUrl.startsWith('http')) {
      const fetched = await fetchRemoteImage(imageUrl);
      if (!fetched) return res.status(400).json({ error: 'Gagal mengunduh gambar dari URL.' });
      imageBytes = fetched.bytes.toString('base64');
      mimeType = fetched.mimeType;
    } else {
      const parsed = parseImageInput(imageUrl);
      if ('error' in parsed) {
        return res.status(400).json({ error: parsed.error, code: parsed.code });
      }
      imageBytes = parsed.imageBytes;
      mimeType = parsed.mimeType;
    }

    const duration = Math.min(8, Math.max(4, Math.round(Number(durationSeconds) || 5)));
    const client = createAiClient();
    let lastFailure = 'Semua model Veo gagal dijalankan.';

    for (const model of VEO_MODEL_CANDIDATES) {
      try {
        console.log(`Veo: memulai image-to-video dengan model ${model}...`);
        let operation = await client.models.generateVideos({
          model,
          source: { prompt, image: { imageBytes, mimeType } },
          config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
            durationSeconds: duration,
            personGeneration: 'allow_adult',
          },
        });

        // Polling operasi LRA (Veo butuh waktu, biasanya30 detik - beberapa menit)
        const startedAt = Date.now();
        while (!operation.done) {
          if (Date.now() - startedAt > 240000) {
            return res.status(504).json({
              error: `Model ${model} tidak selesai dalam240 detik. Coba lagi atau pakai Veo fast.`,
              model,
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 8000));
          operation = await client.operations.getVideosOperation({ operation });
        }

        if (operation.error) {
          return res.status(502).json({ error: humanizeApiError(operation.error), model });
        }

        const video = operation.response?.generatedVideos?.[0]?.video;
        if (!video?.uri) {
          return res.status(502).json({
            error: 'Veo tidak menghasilkan video (kemungkinan tersaring kebijakan konten).',
            raiReasons: operation.response?.raiMediaFilteredReasons || [],
            model,
          });
        }

        // Unduh hasil MP4 (URI butuh identitas API key)
        const key = getProviderValue('GEMINI_API_KEY');
        let download = await fetch(video.uri, { headers: { 'x-goog-api-key': key } });
        if (!download.ok) {
          download = await fetch(
            `${video.uri}${video.uri.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`
          );
        }
        if (!download.ok) {
          return res.status(502).json({
            error: `Video berhasil dibuat (${model}) tetapi gagal diunduh (HTTP ${download.status}).`,
            model,
          });
        }

        const mp4 = Buffer.from(await download.arrayBuffer());
        return res.json({
          success: true,
          engine: 'veo',
          model,
          durationSeconds: duration,
          mimeType: 'video/mp4',
          videoDataUrl: `data:video/mp4;base64,${mp4.toString('base64')}`,
        });
      } catch (err: any) {
        lastFailure = humanizeApiError(err);
        const notFound = /not found|notfound|404|does not exist|is not supported|unsupported/i.test(
          String(err?.message || '')
        );
        if (!notFound || model === VEO_MODEL_CANDIDATES[VEO_MODEL_CANDIDATES.length - 1]) {
          return res.status(502).json({ error: lastFailure, model });
        }
        console.warn(`Model Veo "${model}" tidak tersedia (${lastFailure}) — coba kandidat berikutnya...`);
      }
    }

    return res.status(502).json({ error: lastFailure });
  } catch (error: any) {
    console.error('Error in AI video generation:', error);
    return res.status(500).json({ error: error?.message || 'Gagal membuat video AI.' });
  }
});

// Mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📱 NURA VID mggnura.ai Video Factory running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
