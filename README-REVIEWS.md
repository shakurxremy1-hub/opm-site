# Google Reviews section

The `#reviews` section on `index.html` is filled in at build time by
`fetch-reviews.mjs`. Until it's configured, the page shows a "Be the first
to review OPM Ventures" call-to-action — which is the correct state while the
business has few/no reviews.

## One-time setup

### 1. Get a Google Cloud API key with the Places API (New)

1. <https://console.cloud.google.com/> → create/select a project
2. **APIs & Services → Library →** enable **"Places API (New)"**
3. **APIs & Services → Credentials → Create credentials → API key**
4. Restrict it (recommended): **API restrictions → Places API (New)** only.
   The key is used server-side by this script, so an HTTP-referrer restriction
   isn't needed and would break it.

Billing must be enabled on the project. Reviews fetching is a "Pro" SKU call;
Google gives a large monthly free allotment — running this once per deploy is
effectively free.

### 2. Get the Place ID for OPM Ventures LLC

- Easiest: <https://developers.google.com/maps/documentation/places/web-service/place-id>
  → search the business name → copy the `ChIJ…` string.
- Or open the business on Google Maps, and from the share link / URL grab the
  `cid`/place identifier and resolve it with the tool above.

If OPM Ventures isn't on Google Maps yet, create the **Google Business Profile**
first (<https://business.google.com/>). No profile = no Place ID = no reviews to pull.

### 3. Save the config

```bash
cp reviews.config.example.json reviews.config.json
# edit reviews.config.json — paste the API key + Place ID
```

`reviews.config.json` holds a secret — **do not commit it.** (Env vars
`GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACE_ID` work too and take precedence.)

## Every deploy

```bash
npm run reviews      # rewrites the #reviews block in index.html
```

Then deploy `index.html` as usual.

- `maxReviews` — how many cards to show (Google returns at most 5).
- `minRating` — hide anything below this from the cards (the headline
  rating + total count still reflect your true Google numbers).
- A snapshot of what was fetched is written to `assets/reviews.json`.

## Notes

- Google's Places API (New) returns **at most 5 reviews** per place. For the
  full history you'd need a paid third-party aggregator (Trustindex, Elfsight,
  EmbedSocial) — swap the block between the markers if you go that route.
- The "Leave a Google Review" button points at
  `https://search.google.com/local/writereview?placeid=<PLACE_ID>` once the
  Place ID is set; before that it falls back to a Maps search for the name.
