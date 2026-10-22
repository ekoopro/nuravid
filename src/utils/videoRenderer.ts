import { Scene } from '../types';

interface RenderProgressCallback {
  (progress: number, status: string): void;
}

// Easing untuk gerakan kamera gaya image-to-video: halus di awal & akhir
function easeInOutSine(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return -(Math.cos(Math.PI * clamped) - 1) / 2;
}

// Loop render berbasis WAKTU (bukan jumlah frame) supaya gerakan mulus & durasi akurat.
// rAF untuk foreground (halus), + watchdog interval bila tab ke-background (rAF dibekukan).
function runTimedRenderLoop(options: {
  durationMs: number;
  drawFrame: (elapsedMs: number) => void;
  onTick?: (progress: number) => void;
  onDone: () => void;
}): void {
  const { durationMs, drawFrame, onTick, onDone } = options;
  const startedAt = performance.now();
  let rafId = 0;
  let watchdogId: ReturnType<typeof setInterval> | null = null;
  let finished = false;
  let lastDrawAt = 0;
  let lastTickAt = 0;

  const finish = () => {
    if (finished) return;
    finished = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (watchdogId) clearInterval(watchdogId);
    onTick?.(1);
    // Beri waktu frame terakhir untuk terekam MediaRecorder
    setTimeout(onDone, 200);
  };

  const step = (now: number) => {
    lastDrawAt = now;
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / durationMs);
    drawFrame(elapsed);
    if (now - lastTickAt >= 80) {
      lastTickAt = now;
      onTick?.(progress);
    }
    if (progress >= 1) {
      finish();
      return;
    }
    rafId = requestAnimationFrame(step);
  };

  rafId = requestAnimationFrame(step);

  watchdogId = setInterval(() => {
    if (finished) return;
    const now = performance.now();
    if (now - lastDrawAt > 120) {
      // rAF tidak dipanggil (tab background) — gambar berbasis waktu secara manual
      lastDrawAt = now;
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      drawFrame(elapsed);
      onTick?.(progress);
      if (progress >= 1) finish();
    }
  }, 100);
}

export function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  scene: Scene,
  progress: number, // 0 to 1
  width = 720,
  height = 1280,
  aspectRatio: '9:16' | '16:9' = '9:16'
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Calculate Camera Movement transform
  // Gaya image-to-video: gerakan SATU ARAH yang di-easing (halus), bukan getaran bolak-balik.
  const movement = scene.cameraMovement || 'Handheld Phone Vlog';
  const t = Math.min(1, Math.max(0, progress));
  const e = easeInOutSine(t);
  let scale = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;

  switch (movement) {
    case 'Handheld Phone Vlog':
      // "Breathing" vlog halus: zoom lambat + satu ayunan lambat SELAMA scene (bukan getar)
      scale = 1.05 + e * 0.05;
      offsetX = Math.sin(t * Math.PI * 2) * 5;
      offsetY = Math.sin(t * Math.PI * 2 + Math.PI / 2) * 3;
      rotation = Math.sin(t * Math.PI * 2) * 0.0015;
      break;
    case 'Slow Zoom In':
      scale = 1.03 + e * 0.11;
      break;
    case 'Close-Up Screen Tap':
      scale = 1.08 + e * 0.14;
      offsetY = -e * 25;
      break;
    case 'Over-The-Shoulder POV':
      scale = 1.07 + e * 0.07;
      offsetX = e * 14;
      break;
    case 'Low Angle Toddler Eye-Level':
      scale = 1.05 + e * 0.07;
      offsetY = e * 18;
      break;
    case 'Gentle Pan Right':
      scale = 1.15;
      offsetX = -e * 40;
      break;
    case 'Gentle Pan Left':
      scale = 1.15;
      offsetX = e * 40;
      break;
    case 'Static Clean Framing':
      scale = 1.02;
      break;
    default:
      scale = 1.03 + e * 0.07;
      break;
  }

  // Draw background image
  ctx.translate(width / 2, height / 2);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(-width / 2 + offsetX, -height / 2 + offsetY);

  if (img && img.complete && img.naturalWidth > 0) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;
    let renderW = width;
    let renderH = height;
    let renderX = 0;
    let renderY = 0;

    if (imgRatio > canvasRatio) {
      renderW = height * imgRatio;
      renderX = (width - renderW) / 2;
    } else {
      renderH = width / imgRatio;
      renderY = (height - renderH) / 2;
    }

    ctx.drawImage(img, renderX, renderY, renderW, renderH);
  } else {
    // Warm parenting gradient fallback
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#201614');
    grad.addColorStop(0.5, '#161313');
    grad.addColorStop(1, '#1A211D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();

  // 2. Subtle Cinematic/Vlog Vignette & Scrims (Top and Bottom for readability)
  const topScrim = ctx.createLinearGradient(0, 0, 0, height * 0.25);
  topScrim.addColorStop(0, 'rgba(0,0,0,0.7)');
  topScrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, width, height * 0.25);

  const bottomScrim = ctx.createLinearGradient(0, height * 0.65, 0, height);
  bottomScrim.addColorStop(0, 'rgba(0,0,0,0)');
  bottomScrim.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = bottomScrim;
  ctx.fillRect(0, height * 0.65, width, height * 0.35);

  // 3. Top Branding & Marketing Beat Badge (TikTok/Reels Safe Zone)
  ctx.font = '800 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#e50914';
  ctx.letterSpacing = '1px';
  ctx.fillText('mggnura.ai', 36, 54);

  ctx.font = '700 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(scene.marketingBeat || `SCENE ${scene.sceneNumber}`, 130, 54);

  // 4. ON-SCREEN TEXT (Hook & Caption pop-up style TikTok)
  if (scene.onScreenText) {
    const rawText = scene.onScreenText;
    const boxY = height * 0.2;
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    // Wrap text if needed
    const maxBoxWidth = width * 0.88;
    const words = rawText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const test = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(test).width > maxBoxWidth) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineH = 38;
    const totalBoxH = lines.length * lineH + 20;

    // Yellow/White high impact backing box
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 3;
    const boxX = (width - maxBoxWidth) / 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY - 10, maxBoxWidth, totalBoxH, 14);
    ctx.fill();
    ctx.stroke();

    lines.forEach((line, idx) => {
      const y = boxY + 22 + idx * lineH;
      ctx.fillStyle = '#FFE600';
      ctx.fillText(line, width / 2, y);
    });

    ctx.textAlign = 'left';
  }

  // 5. SUBTITLES (Voiceover narration in lower safe zone)
  if (scene.narrationSegment) {
    const subtitleText = scene.narrationSegment;
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    const maxSubWidth = width * 0.84;
    const words = subtitleText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxSubWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineH = 32;
    const totalSubH = lines.length * lineH;
    const subYStart = height - 180 - totalSubH;

    lines.forEach((line, idx) => {
      const y = subYStart + idx * lineH;

      // Heavy black stroke for TikTok contrast readability
      ctx.strokeStyle = 'rgba(0,0,0,0.95)';
      ctx.lineWidth = 6;
      ctx.strokeText(line, width / 2, y);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(line, width / 2, y);
    });

    ctx.textAlign = 'left';
  }

  // 6. Bottom Callout Tag (e.g. CTA link in bio reminder)
  ctx.font = '700 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('🔗 Kunjungi mggnura.ai • Free Trial 7 Hari', width / 2, height - 70);
  ctx.textAlign = 'left';
}

export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = url;
  });
}

// Render a single 9:16 scene video Blob
export async function renderSceneVideoBlob(
  scene: Scene,
  onProgress?: (progress: number) => void,
  aspectRatio: '9:16' | '16:9' = '9:16'
): Promise<Blob> {
  const isVertical = aspectRatio === '9:16';
  const width = isVertical ? 720 : 1280;
  const height = isVertical ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const img = scene.imageUrl ? await preloadImage(scene.imageUrl) : null;
  const durationSec = Math.max(3, scene.durationSeconds || 5);
  const fps = 30;

  return new Promise(async (resolve, reject) => {
    try {
      const stream = canvas.captureStream(fps);

      // Synthesize audio chime
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const dest = audioCtx.createMediaStreamDestination();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();

        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);
      } catch (e) {}

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        resolve(videoBlob);
      };

      recorder.start();

      const durationMs = durationSec * 1000;
      runTimedRenderLoop({
        durationMs,
        drawFrame: (elapsedMs) => {
          const progress = Math.min(1, elapsedMs / durationMs);
          drawSceneFrame(ctx, img, scene, progress, width, height, aspectRatio);
        },
        onTick: (progress) => onProgress?.(progress),
        onDone: () => recorder.stop(),
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Master Render: Render all 9:16 scenes into one continuous marketing video
export async function renderFullMovieBlob(
  scenes: Scene[],
  onProgress?: RenderProgressCallback,
  aspectRatio: '9:16' | '16:9' = '9:16'
): Promise<Blob> {
  const isVertical = aspectRatio === '9:16';
  const width = isVertical ? 720 : 1280;
  const height = isVertical ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  onProgress?.(0.02, 'Memuat aset visual video vertikal 9:16...');

  const loadedImages: (HTMLImageElement | null)[] = await Promise.all(
    scenes.map(async (s) => (s.imageUrl ? preloadImage(s.imageUrl) : null))
  );

  const fps = 30;
  const sceneDurations = scenes.map((s) => Math.max(3, s.durationSeconds || 5));
  const totalDurationSec = sceneDurations.reduce((a, b) => a + b, 0);

  return new Promise((resolve, reject) => {
    try {
      const stream = canvas.captureStream(fps);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunks, { type: 'video/webm' });
        onProgress?.(1.0, 'Rendering video marketing 9:16 selesai!');
        resolve(fullBlob);
      };

      recorder.start();

      // Loop berbasis waktu: setiap beat dihitung dari akumulasi durasi (mulus & akurat)
      let statusText = 'Menyiapkan rendering...';

      runTimedRenderLoop({
        durationMs: totalDurationSec * 1000,
        drawFrame: (elapsedMs) => {
          const elapsedSec = elapsedMs / 1000;
          let idx = 0;
          let accumulated = 0;
          while (idx < scenes.length - 1 && elapsedSec >= accumulated + sceneDurations[idx]) {
            accumulated += sceneDurations[idx];
            idx++;
          }
          const sceneProgress = Math.min(
            1,
            (elapsedSec - accumulated) / sceneDurations[idx]
          );
          statusText = `Merender Beat ${idx + 1}/${scenes.length}: ${scenes[idx].sceneTitle}...`;
          drawSceneFrame(
            ctx,
            loadedImages[idx],
            scenes[idx],
            sceneProgress,
            width,
            height,
            aspectRatio
          );
        },
        onTick: (progress) => onProgress?.(Math.min(0.99, progress), statusText),
        onDone: () => recorder.stop(),
      });
    } catch (err) {
      reject(err);
    }
  });
}
