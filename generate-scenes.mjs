/**
 * generate-scenes.mjs
 * Multi-scene cinematic flight footage: Flux Schnell still -> Kling image-to-video,
 * one clip per scene, written to src/sceneN.mp4 for build-frames.sh to consume.
 *
 * Warm/cinematic register (ember/teal palette), explicitly avoiding the old
 * "hologram / neural network / electric indigo" sci-fi language. First/last-frame
 * composition is kept simple (static wide shots, slow push) per clip so cuts
 * between scenes don't jar.
 *
 * Run: FAL_KEY=your-key node generate-scenes.mjs
 */

import { fal } from '@fal-ai/client';
import { writeFileSync, mkdirSync } from 'fs';

if (!process.env.FAL_KEY) {
  console.error('FAL_KEY required. export FAL_KEY=your-key');
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });
mkdirSync('./src', { recursive: true });
mkdirSync('./assets', { recursive: true });

const SCENES = [
  {
    id: 'scene1',
    name: 'Command',
    image: `
Photorealistic wide shot of a dim, warm-lit operations desk at dusk, seen through a
large window with a soft-focus cityscape skyline behind it. Warm amber practical
lighting (desk lamp, ambient room light), a laptop screen giving a subtle warm glow,
some depth-of-field blur. Grounded, real, lived-in — not futuristic or sci-fi.
No people, no text, no on-screen UI close-ups.
Color palette: warm near-black background (#0a0a0c), ember/copper accents (#d17a42),
soft warm highlights. Mood: quiet, focused, premium, cinematic photography, 35mm lens look.
    `.trim(),
    motion: `
Slow, smooth cinematic push-in toward the desk and window. Subtle warm light flicker
from the screen glow. No sudden moves, no cuts, no camera shake. 5 seconds, stable.
    `.trim(),
  },
  {
    id: 'scene2',
    name: 'The Network',
    image: `
Photorealistic macro/medium close-up of a smartphone or tablet resting on a wooden
desk, its screen lighting up with a soft notification glow. Shallow depth of field,
warm ember highlights reflecting off the device edge, blurred warm background bokeh.
Grounded and tactile, not sci-fi or holographic. No visible UI text, no people.
Color palette: warm near-black background (#0a0a0c), ember (#d17a42) and a touch of
desaturated teal (#3f8f8a) in the background bokeh. Mood: premium product photography.
    `.trim(),
    motion: `
Slow, smooth cinematic drift/push toward the lit device. Gentle light pulse as if a
notification just arrived. Stable, no sudden moves. 5 seconds.
    `.trim(),
  },
  {
    id: 'scene3',
    name: 'The Reach',
    image: `
Photorealistic aerial drone shot gliding over a mid-size American city skyline at
golden hour — warm sunset light, rooftops, streets, a hint of suburban sprawl in the
distance, evoking a San Antonio, Texas type of skyline. Cinematic drone cinematography,
wide angle, warm golden-hour color grade. No text, no logos, no people visible.
Color palette: warm amber/gold sky, dark near-black ground shadows, ember accents.
Mood: aspirational, grounded, real-estate-adjacent, premium.
    `.trim(),
    motion: `
Slow, smooth forward glide over the skyline, gentle altitude drift, stable drone
camera work, golden-hour light shimmer. No sudden moves. 5 seconds.
    `.trim(),
  },
  {
    id: 'scene4',
    name: 'The Work',
    image: `
Photorealistic macro close-up of a hand resting on a tablet screen, or alternatively
a hand pushing open a modern door with warm interior light spilling through — a
tactile, premium, human closing beat. Shallow depth of field, warm ember rim light,
dark near-black surroundings. No visible text or UI. No full face visible.
Color palette: warm near-black background (#0a0a0c), ember (#d17a42) rim lighting.
Mood: tactile, confident, premium, quiet close-out shot.
    `.trim(),
    motion: `
Slow, smooth cinematic push-in on the hand/door. Subtle warm light shift. Stable,
no sudden moves, no cuts. 5 seconds.
    `.trim(),
  },
];

async function generateStill(scene) {
  console.log(`\n[${scene.id}] 1/2 — still via Flux Schnell...`);
  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt: scene.image,
      image_size: 'landscape_16_9',
      num_inference_steps: 4,
      num_images: 1,
    },
    logs: true,
    onQueueUpdate(u) { if (u.status === 'IN_PROGRESS') process.stdout.write('.'); }
  });
  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error(`[${scene.id}] no image URL: ` + JSON.stringify(result));
  const res = await fetch(imageUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`./assets/${scene.id}-still.jpg`, buf);
  console.log(`\n  saved assets/${scene.id}-still.jpg`);
  return imageUrl;
}

async function generateVideo(scene, imageUrl) {
  console.log(`[${scene.id}] 2/2 — animating with Kling v1.6...`);
  const result = await fal.subscribe('fal-ai/kling-video/v1.6/standard/image-to-video', {
    input: {
      prompt: scene.motion,
      image_url: imageUrl,
      duration: '5',
      aspect_ratio: '16:9',
      cfg_scale: 0.5,
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
  if (!videoUrl) throw new Error(`[${scene.id}] no video URL: ` + JSON.stringify(result));
  const res = await fetch(videoUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`./src/${scene.id}.mp4`, buf);
  console.log(`\n  saved src/${scene.id}.mp4`);
}

try {
  for (const scene of SCENES) {
    const imageUrl = await generateStill(scene);
    await generateVideo(scene, imageUrl);
  }
  console.log(`
✓ Done! ${SCENES.length} scene clips written to src/scene1.mp4..src/scene${SCENES.length}.mp4
Next: run ./build-frames.sh to produce assets/frames/ + assets/frames-m/
`);
} catch (err) {
  console.error('\nGeneration failed:', err.message || err);
  process.exit(1);
}
