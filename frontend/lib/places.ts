// Place autocomplete via Photon (Komoot) — https://photon.komoot.io
// Free, no API key, CORS-enabled, backed by OpenStreetMap. Good coverage for
// Indian metros; sparser for tier-3 towns (but the user can still type freely).

import { CITY_COORDS, type Coords } from "./city";

export interface PlaceSuggestion {
  name: string;          // primary label, e.g. "Bopal"
  city?: string;
  state?: string;
  type?: string;
  /** "Ahmedabad, Gujarat" — secondary subtitle */
  fullLabel: string;
}

export interface SearchOptions {
  /**
   * Lat/lon used as the primary bias. When set, Photon orders results by
   * proximity to this point — this is what makes suggestions feel "nearby".
   */
  coordBias?: Coords | null;
  /**
   * Fallback city name. Used only if coordBias is missing AND the city is in
   * our known-metros map. Also used to push results in this city to the top
   * after fetch (defensive — Photon's spatial bias usually does this already).
   */
  cityBias?: string;
}

const ENDPOINT = "https://photon.komoot.io/api/";

// Place types we consider relevant. Streets/POIs are excluded so the dropdown
// doesn't fill up with shop addresses.
const ALLOWED_TYPES = new Set([
  "suburb", "neighbourhood", "quarter", "locality",
  "village", "town", "hamlet", "city", "district",
]);

// In-memory cache, keyed by query + bias. Cleared on page reload.
const cache = new Map<string, PlaceSuggestion[]>();

export async function searchPlaces(
  query: string,
  options: SearchOptions = {},
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // Prefer explicit coords; fall back to the known-city centroid; otherwise no bias.
  const bias: Coords | null =
    options.coordBias ??
    (options.cityBias ? CITY_COORDS[options.cityBias] ?? null : null);

  const cacheKey =
    `${q.toLowerCase()}|${bias?.lat ?? ""}|${bias?.lon ?? ""}|${options.cityBias ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ q, lang: "en", limit: "15" });
  if (bias) {
    params.set("lat", String(bias.lat));
    params.set("lon", String(bias.lon));
  }

  try {
    const r = await fetch(`${ENDPOINT}?${params.toString()}`, { signal });
    if (!r.ok) return [];
    const data = await r.json();
    const features: any[] = data?.features ?? [];

    const out: PlaceSuggestion[] = [];
    for (const f of features) {
      const p = f?.properties ?? {};
      if (p.country !== "India") continue;
      const type: string = p.type ?? p.osm_value ?? "";

      const cityMatchesBias =
        !!options.cityBias &&
        (p.city?.toLowerCase() === options.cityBias.toLowerCase() ||
          p.county?.toLowerCase() === options.cityBias.toLowerCase());

      // Inside the user's city, accept anything (even neighborhoods Photon
      // tagged loosely). Outside it, restrict to the standard "place" types.
      if (!cityMatchesBias && !ALLOWED_TYPES.has(type)) continue;

      const city = p.city ?? p.county ?? "";
      const state = p.state ?? "";
      out.push({
        name: p.name ?? "",
        city,
        state,
        type,
        fullLabel: [city, state].filter(Boolean).join(", "),
      });
    }

    // De-duplicate by name+city — Photon sometimes returns near-duplicates.
    const seen = new Set<string>();
    const deduped = out.filter((s) => {
      const k = `${s.name}|${s.city}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // City-matched suggestions first, then everything else. Photon's spatial
    // bias usually handles this, but our cityBias is more authoritative for
    // the cases where the user picked a city manually.
    const biasLower = options.cityBias?.toLowerCase();
    deduped.sort((a, b) => {
      const aBiased = biasLower && a.city?.toLowerCase() === biasLower ? 1 : 0;
      const bBiased = biasLower && b.city?.toLowerCase() === biasLower ? 1 : 0;
      return bBiased - aBiased;
    });

    const top = deduped.slice(0, 8);
    cache.set(cacheKey, top);
    return top;
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    return [];
  }
}
