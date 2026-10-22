import { Scene } from '../types';

// ==== AI IMAGE-TO-VIDEO (Google Veo) ====
// Rasterisasi gambar apa pun (termasuk data URL SVG dari fallback server,
// atau URL remote seperti Unsplash) menjadi JPEG base64 yang bisa dikirim ke Veo.
export function rasterizeImageToDataUrl(url: string, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(2, Math.round(img.naturalWidth * ratio));
        const height = Math.max(2, Math.round(img.naturalHeight * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D tidak tersedia.');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err: any) {
        reject(new Error('Gagal merasterisasi gambar: ' + (err?.message || err)));
      }
    };
    img.onerror = () => reject(new Error('Gambar gagal dimuat untuk dirasterisasi.'));
    img.src = url;
  });
}

// Arahan gerakan kamera untuk Veo (bahasa Inggris, tanpa teks di dalam video)
const CAMERA_HINTS: Record<string, string> = {
  'Handheld Phone Vlog':
    'Natural handheld smartphone vlog camera with gentle organic movement, subtle breathing motion.',
  'Slow Zoom In': 'Very slow smooth cinematic zoom-in toward the subject.',
  'Close-Up Screen Tap': 'Slow push-in close-up as a hand taps the phone screen.',
  'Over-The-Shoulder POV': 'Over-the-shoulder POV shot with a slight slow drift.',
  'Low Angle Toddler Eye-Level': 'Low camera angle at a toddler eye level with a gentle rise.',
  'Gentle Pan Right': 'Slow smooth pan to the right.',
  'Gentle Pan Left': 'Slow smooth pan to the left.',
  'Static Clean Framing': 'Locked-off static tripod framing, no camera movement.',
};

export function buildVeoPromptForScene(scene: Scene): string {
  const parts = [
    'Realistic vertical smartphone UGC-style video for a parenting app advertisement.',
    `Animate this exact starting photo: ${scene.visualDescription}`,
    scene.backgroundSetting ? `Setting: ${scene.backgroundSetting}.` : '',
    CAMERA_HINTS[scene.cameraMovement] || 'Slow smooth cinematic camera drift.',
    'Natural lighting, authentic Indonesian family lifestyle, cinematic depth of field, subtle realistic motion such as blinking, breathing and gentle gestures.',
    'No text, no captions, no subtitles, no watermarks, no logos.',
  ];
  return parts.filter(Boolean).join(' ');
}

export interface AiVideoResult {
  videoUrl: string; // blob: URL (MP4 asli dari Veo)
  model: string;
}

export async function generateAiSceneVideo(
  scene: Scene,
  onStatus?: (message: string) => void
): Promise<AiVideoResult> {
  if (!scene.imageUrl) {
    throw new Error('Scene ini belum punya gambar — buat visual dulu di Step 2/3.');
  }

  onStatus?.('Menyiapkan gambar (rasterisasi JPEG)...');
  const imageDataUrl = await rasterizeImageToDataUrl(scene.imageUrl);
  const durationSeconds = Math.min(8, Math.max(4, Math.round(scene.durationSeconds || 5)));

  onStatus?.('Mengirim ke Google Veo (image-to-video). Proses bisa 1-3 menit, mohon tunggu...');
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: buildVeoPromptForScene(scene),
      imageUrl: imageDataUrl,
      aspectRatio: '9:16',
      durationSeconds,
      sceneTitle: scene.sceneTitle,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success || !data.videoDataUrl) {
    throw new Error(data.error || data.message || 'Generasi video AI (Veo) gagal.');
  }

  onStatus?.('Mengonversi hasil Veo menjadi MP4...');
  const base64 = data.videoDataUrl.split(',')[1];
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'video/mp4' });

  return {
    videoUrl: URL.createObjectURL(blob),
    model: String(data.model || 'veo'),
  };
}
