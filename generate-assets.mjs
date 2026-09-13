/**
 * generate-assets.mjs
 * Singh in USA workflow: GPT Image still → Kling image-to-video
 *
 * Step 1: Generate hero still via fal.ai flux/schnell (fast, free-tier friendly)
 * Step 2: Animate that still with Kling v3 image-to-video
 * Step 3: Save both to assets/
 *
 * Run: FAL_KEY=your-key node generate-assets.mjs
 */

import { fal } from '@fal-ai/client';
import { writeFileSync, mkdirSync } from 'fs';

if (!process.env.FAL_KEY) {
  console.error('FAL_KEY required. export FAL_KEY=your-key');
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });
mkdirSync('./assets', { recursive: true });

// ── STEP 1 — Hero still via Flux Schnell (fast + cheap) ──────────────────────
const IMAGE_PROMPT = `
Photorealistic aerial establishing shot of a futuristic AI command center at night.
Deep black environment with electric indigo and cyan ambient lighting glowing through glass panels.
Holographic neural network data streams floating in mid-air.
Sleek minimalist architecture, dark surfaces, subtle particle light trails.
Ultra cinematic, IMAX quality, wide angle lens, no people, no text.
Color palette: near-black #050508 background with #6366f1 indigo and #06b6d4 cyan light sources.
Mood: serious, operational, premium, high-tech intelligence.
`.trim();

async function generateStill() {
  console.log('\n[1/2] Generating hero still with Flux Schnell...');

  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt: IMAGE_PROMPT,
      image_size: 'landscape_16_9',
      num_inference_steps: 4,
      num_images: 1,
    },
    logs: true,
    onQueueUpdate(u) {
      if (u.status === 'IN_PROGRESS') process.stdout.write('.');
    }
  });

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error('No image URL: ' + JSON.stringify(result));

  console.log('\n  Still URL:', imageUrl);

  const res = await fetch(imageUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync('./assets/hero-still.jpg', buf);
  console.log('  Saved: assets/hero-still.jpg');

  return imageUrl;
}

// ── STEP 2 — Kling image-to-video ────────────────────────────────────────────
async function generateVideo(imageUrl) {
  console.log('\n[2/2] Animating still with Kling v3...');

  const MOTION_PROMPT = `
Cinematic slow camera push forward into the AI command center.
Subtle holographic data streams flowing across the frame.
Indigo and cyan light pulses gently. Particles drift upward.
Smooth, stable, premium motion. 5 seconds. No sudden cuts.
  `.trim();

  const result = await fal.subscribe('fal-ai/kling-video/v1.6/standard/image-to-video', {
    input: {
      prompt:         MOTION_PROMPT,
      image_url:      imageUrl,
      duration:       '5',
      aspect_ratio:   '16:9',
      cfg_scale:      0.5,
    },
    logs: true,
    onQueueUpdate(u) {
      if (u.status === 'IN_PROGRESS') {
        const msg = u.logs?.map(l => l.message).join(' | ') || '...';
        process.stdout.write('\r  ' + msg.substring(0, 60).padEnd(60));
      }
    }
  });

  const videoUrl = result.data?.video?.url;
  if (!videoUrl) throw new Error('No video URL: ' + JSON.stringify(result));

  console.log('\n  Video URL:', videoUrl);

  const res = await fetch(videoUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync('./assets/hero-loop.mp4', buf);
  console.log('  Saved: assets/hero-loop.mp4');
}

// ── RUN ──────────────────────────────────────────────────────────────────────
try {
  const imageUrl = await generateStill();
  await generateVideo(imageUrl);

  console.log(`
✓ Done! Assets generated:
  assets/hero-still.jpg  — hero background still
  assets/hero-loop.mp4   — Kling-animated hero video

The index.html already points to assets/hero-loop.mp4 and assets/hero-still.jpg.
Open index.html in a browser — the scroll-scrubbed video is live.
`);
} catch (err) {
  console.error('\nGeneration failed:', err.message || err);
  process.exit(1);
}
