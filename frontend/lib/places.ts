// Place autocomplete via Photon (Komoot) — https://photon.komoot.io
// Free, no API key, CORS-enabled, backed by OpenStreetMap. Good coverage for
// Indian metros; sparser for tier-3 towns (but the user can still type freely).

export interface PlaceSuggestion {
  name: string;          // primary label, e.g. "Bopal"
  city?: string;
  state?: string;
  type?: string;
  /** "Ahmedabad, Gujarat" — secondary subtitle */
  fullLabel: string;
}

const ENDPOINT = "https://photon.komoot.io/api/";

// Approximate centroids for the major Indian cities we list. Used to bias
// Photon results so typing "Vesu" while in Surat surfaces Surat hits first.
const CITY_COORDS: Record<string, [number, number]> = {
  Ahmedabad: [23.0225, 72.5714],
  Mumbai: [19.0760, 72.8777],
  Pune: [18.5204, 73.8567],
  Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.3850, 78.4867],
  Chennai: [13.0827, 80.2707],
  Delhi: [28.7041, 77.1025],
  Gurgaon: [28.4595, 77.0266],
  Noida: [28.5355, 77.3910],
  Kolkata: [22.5726, 88.3639],
  Jaipur: [26.9124, 75.7873],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],
  Rajkot: [22.3039, 70.8022],
  Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126],
  Nagpur: [21.1458, 79.0882],
  Lucknow: [26.8467, 80.9462],
  Chandigarh: [30.7333, 76.7794],
  Kochi: [9.9312, 76.2673],
};

// Place types we consider relevant. Streets/POIs are excluded so the dropdown
// doesn't fill up with shop addresses.
const ALLOWED_TYPES = new Set([
  "suburb", "neighbourhood", "quarter", "locality",
  "village", "town", "hamlet", "city", "district",
]);

// In-memory cache, keyed by query + city bias. Cleared on page reload.
const cache = new Map<string, PlaceSuggestion[]>();

export async function searchPlaces(
  query: string,
  cityBias?: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = `${q.toLowerCase()}|${cityBias ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ q, lang: "en", limit: "15" });
  const coords = cityBias ? CITY_COORDS[cityBias] : undefined;
  if (coords) {
    params.set("lat", String(coords[0]));
    params.set("lon", String(coords[1]));
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
        !!cityBias &&
        (p.city?.toLowerCase() === cityBias.toLowerCase() ||
          p.county?.toLowerCase() === cityBias.toLowerCase());

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

    // City-matched suggestions first, then everything else.
    const biasLower = cityBias?.toLowerCase();
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
