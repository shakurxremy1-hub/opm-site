#!/usr/bin/env node
/**
 * fetch-reviews.mjs — pulls the OPM Ventures Google Business Profile reviews
 * and bakes them into index.html between the <!-- REVIEWS:START --> / :END markers.
 *
 * Config (either works):
 *   env:   GOOGLE_PLACES_API_KEY=...  GOOGLE_PLACE_ID=...
 *   file:  reviews.config.json  ->  { "apiKey": "...", "placeId": "...", "maxReviews": 6, "minRating": 4 }
 *
 * Run:  npm run reviews   (do this before every deploy)
 *
 * No config? The script exits 0 and leaves the "be the first to review us"
 * block in place, so it's safe to wire into a build with nothing set yet.
 *
 * Note: Google's Places API (New) returns at most 5 reviews per place — that's
 * a platform limit, not a bug here.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(ROOT, 'index.html');
const SNAPSHOT = path.join(ROOT, 'assets', 'reviews.json');
const START = '<!-- REVIEWS:START -->';
const END = '<!-- REVIEWS:END -->';

// ---------- config ----------
let cfg = { apiKey: '', placeId: '', maxReviews: 6, minRating: 4 };
if (existsSync(path.join(ROOT, 'reviews.config.json'))) {
  Object.assign(cfg, JSON.parse(await readFile(path.join(ROOT, 'reviews.config.json'), 'utf8')));
}
if (process.env.GOOGLE_PLACES_API_KEY) cfg.apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (process.env.GOOGLE_PLACE_ID) cfg.placeId = process.env.GOOGLE_PLACE_ID;

// ---------- helpers ----------
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stars = (n) => {
  const full = Math.round(n || 0);
  return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full);
};
const starsMarkup = (n) => {
  const full = Math.round(n || 0);
  return `<span aria-hidden="true">${'★'.repeat(full)}<span class="empty">${'★'.repeat(5 - full)}</span></span>`;
};
const initials = (name = '?') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

const writeReviewUrl = (placeId) =>
  placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
    : 'https://www.google.com/maps/search/?api=1&query=OPM%20Ventures%20LLC';

// ---------- empty-state block (also the default in the repo) ----------
const emptyBlock = (placeId) => `
    <div class="rev-empty" id="rev-empty">
      <div class="rev-empty-title">Be the first to review OPM Ventures</div>
      <div class="rev-empty-body">
        Worked with us on an AI system, a courier run, or a real estate move?
        A 60-second Google review helps other operators find us.
      </div>
      <a href="${writeReviewUrl(placeId)}" target="_blank" rel="noopener" class="btn-primary" id="rev-write">
        Leave a Google Review
        <span class="btn-icon">↗</span>
      </a>
    </div>
`;

// ---------- populated block ----------
const card = (r) => {
  const name = r.authorAttribution?.displayName || 'Google user';
  const photo = r.authorAttribution?.photoUri;
  const when = r.relativePublishTimeDescription || '';
  const body = r.text?.text || r.originalText?.text || '';
  const avatar = photo
    ? `<img class="rev-avatar" src="${esc(photo)}" alt="" referrerpolicy="no-referrer" loading="lazy">`
    : `<div class="rev-avatar">${esc(initials(name))}</div>`;
  return `
      <div class="rev-card">
        <div class="rev-card-inner">
          <div class="rev-card-stars" aria-label="${r.rating || 5} out of 5 stars">${starsMarkup(r.rating || 5)}</div>
          <p class="rev-quote">${esc(body)}</p>
          <div class="rev-author">
            ${avatar}
            <div class="rev-author-text">
              <strong>${esc(name)}</strong>
              <span>${esc(when)}${when ? ' · ' : ''}via Google</span>
            </div>
          </div>
        </div>
      </div>`;
};

const populatedBlock = (place, reviews, placeId) => {
  const rating = place.rating ? Number(place.rating).toFixed(1) : null;
  const count = place.userRatingCount || reviews.length;
  const seeAll = place.googleMapsUri || 'https://www.google.com/maps/search/?api=1&query=OPM%20Ventures%20LLC';
  return `
    <div class="rev-summary" id="rev-summary">
      <div class="rev-score">${rating ?? '—'}</div>
      <div class="rev-summary-mid">
        <div class="rev-stars" aria-label="${rating ?? ''} out of 5">${starsMarkup(place.rating || 5)}</div>
        <span class="rev-count">${count} Google review${count === 1 ? '' : 's'} <span class="rev-g">Google</span></span>
      </div>
      <div class="rev-summary-actions">
        <a class="btn-ghost" href="${esc(seeAll)}" target="_blank" rel="noopener">See all on Google <span>↗</span></a>
        <a class="btn-primary" href="${writeReviewUrl(placeId)}" target="_blank" rel="noopener">Leave a Review <span class="btn-icon">↗</span></a>
      </div>
    </div>
    <div class="reviews-grid" id="reviews-grid">${reviews.map(card).join('')}
    </div>
`;
};

// ---------- splice into index.html ----------
async function splice(inner) {
  const html = await readFile(HTML, 'utf8');
  const i = html.indexOf(START);
  const j = html.indexOf(END);
  if (i === -1 || j === -1) {
    console.error(`✗ Could not find ${START} / ${END} markers in index.html`);
    process.exit(1);
  }
  const next = html.slice(0, i + START.length) + '\n' + inner + '    ' + html.slice(j);
  await writeFile(HTML, next);
}

// ---------- main ----------
if (!cfg.apiKey || !cfg.placeId) {
  console.log('ℹ  No GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID set — leaving the "leave us a review" block in place.');
  console.log('   Set them in reviews.config.json or as env vars, then re-run `npm run reviews`.');
  console.log('   How to get them:  see README-REVIEWS.md');
  await splice(emptyBlock(cfg.placeId));
  process.exit(0);
}

const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(cfg.placeId)}`;
const fieldMask = 'id,displayName,rating,userRatingCount,googleMapsUri,reviews';

let place;
try {
  const res = await fetch(url, {
    headers: { 'X-Goog-Api-Key': cfg.apiKey, 'X-Goog-FieldMask': fieldMask },
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`✗ Places API ${res.status}: ${json.error?.message || JSON.stringify(json)}`);
    process.exit(1);
  }
  place = json;
} catch (e) {
  console.error('✗ Request failed:', e.message);
  process.exit(1);
}

const all = Array.isArray(place.reviews) ? place.reviews : [];
const shown = all
  .filter((r) => (r.rating || 5) >= (cfg.minRating ?? 0))
  .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.publishTime || '').localeCompare(a.publishTime || ''))
  .slice(0, cfg.maxReviews ?? 6);

await writeFile(
  SNAPSHOT,
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? 0,
      googleMapsUri: place.googleMapsUri ?? null,
      reviews: shown.map((r) => ({
        author: r.authorAttribution?.displayName ?? null,
        rating: r.rating ?? null,
        when: r.relativePublishTimeDescription ?? null,
        text: r.text?.text ?? r.originalText?.text ?? '',
      })),
    },
    null,
    2,
  ),
);

if (shown.length === 0) {
  console.log(`ℹ  Place found (${place.userRatingCount || 0} ratings) but no reviews ≥ ${cfg.minRating}. Keeping the review CTA.`);
  await splice(emptyBlock(cfg.placeId));
} else {
  await splice(populatedBlock(place, shown, cfg.placeId));
  console.log(`✓ Baked ${shown.length} review(s) into index.html — ${place.rating}★ from ${place.userRatingCount} total.`);
}
