/**
 * generate-hero.js
 * Generates the hero loop video for opm-ventures-site using Kling v3 via fal.ai
 *
 * Usage:
 *   export FAL_KEY=your-key-here
 *   node generate-hero.js
 *
 * Output: assets/hero-loop.mp4
 * Then update index.html video src to "assets/hero-loop.mp4"
 */

import { fal } from '@fal-ai/client';
import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';

// ── Precondition ─────────────────────────────────────
if (!process.env.FAL_KEY) {
  console.error('FAL_KEY is required.\nSet it: export FAL_KEY=your-key\nGet one: https://fal.ai/dashboard/keys');
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

mkdirSync('./assets', { recursive: true });

// ── Prompt for Kling ─────────────────────────────────
// cinematic establishing shot, dark premium AI command center
// matches #050508 background, indigo light sources
const PROMPT = `
Cinematic aerial establishing shot of a futuristic AI command center at night.
Dark environment with deep indigo and electric blue ambient lighting.
Holographic data streams and neural network visualizations floating in the air.
Sleek minimalist architecture, glass surfaces, subtle particle effects.
Camera slowly pushes forward revealing the scale of the operation.
Ultra high definition, IMAX quality, film grain, anamorphic lens flare.
No text, no people visible. Background atmosphere only.
Mood: serious, operational, premium, intelligence.
`.trim();

async function generate() {
  console.log('Generating hero video with Kling v3...');

  const result = await fal.subscribe('fal-ai/kling-video/v3/standard/text-to-video', {
    input: {
      prompt: PROMPT,
      duration: '5',       // 5s — keeps cost low, loops well
      aspect_ratio: '16:9',
      cfg_scale: 0.5,
    },
    logs: true,
    onQueueUpdate(update) {
      if (update.status === 'IN_PROGRESS') {
        console.log('  Progress:', update.logs?.map(l => l.message).join(' | ') || '...');
      }
    }
  });

  const videoUrl = result.data?.video?.url;
  if (!videoUrl) {
    console.error('No video URL in response:', result);
    process.exit(1);
  }

  console.log('Video URL:', videoUrl);
  console.log('Downloading...');

  const res  = await fetch(videoUrl);
  const buf  = Buffer.from(await res.arrayBuffer());
  writeFileSync('./assets/hero-loop.mp4', buf);

  console.log('\n✓ Saved to assets/hero-loop.mp4');
  console.log('Update index.html video src: "../shakur-portfolio/assets/luxury-resort.mp4" → "assets/hero-loop.mp4"');
}

generate().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
