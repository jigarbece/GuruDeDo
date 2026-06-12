/**
 * Unified location model for Gurudedo search and registration.
 *
 * A LocationSelection is either:
 *   - type "city"  → search all coaches in that city
 *   - type "area"  → search coaches in that area within a city
 *
 * This replaces the old dual (city string + area string) approach which had
 * the bug where "Ahmedabad" typed in the area box would match the area column
 * and return zero results.
 */

import { CITY_COORDS, type Coords } from "./city";
import { MAJOR_INDIAN_CITIES, AREAS_BY_CITY } from "../constants/categories";

export interface LocationSelection {
  type: "city" | "area";
  city: string;
  area?: string;          // only set when type === "area"
  displayName: string;    // what appears in the input, e.g. "Maninagar, Ahmedabad"
}

export interface LocationSuggestion extends LocationSelection {
  badge: string;          // "City" | "Area"  — shown as the right-side pill
  coords?: Coords;        // used to bias Photon on subsequent queries
}

// ---- Static suggestion builder ----------------------------------------------

const CITY_COORDS_MAP = CITY_COORDS;

/** Build instant static suggestions from our local data (no network). */
function staticSuggestions(query: string): LocationSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: LocationSuggestion[] = [];

  // 1. Cities that match
  for (const city of MAJOR_INDIAN_CITIES) {
    if (city.toLowerCase().includes(q)) {
      results.push({
        type: "city",
        city,
        displayName: city,
        badge: "City",
        coords: CITY_COORDS_MAP[city],
      });
    }
  }

  // 2. Areas that match (across all cities)
  for (const [city, areas] of Object.entries(AREAS_BY_CITY)) {
    for (const area of areas) {
      if (area.toLowerCase().includes(q)) {
        results.push({
          type: "area",
          city,
          area,
          displayName: `${area}, ${city}`,
          badge: "Area",
          coords: CITY_COORDS_MAP[city],
        });
      }
    }
  }

  return results.slice(0, 10);
}

// ---- Photon (OSM) live search -----------------------------------------------

const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";
const ALLOWED_CITY_TYPES = new Set(["city", "town", "village", "hamlet"]);
const ALLOWED_AREA_TYPES = new Set([
  "suburb", "neighbourhood", "quarter", "locality", "district",
  "city", "town", "village", "hamlet",
]);

const cache = new Map<string, LocationSuggestion[]>();

async function photonSearch(
  query: string,
  bias?: Coords | null,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  const cacheKey = `${q.toLowerCase()}|${bias?.lat ?? ""}|${bias?.lon ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ q, lang: "en", limit: "15" });
  if (bias) {
    params.set("lat", String(bias.lat));
    params.set("lon", String(bias.lon));
  }

  try {
    const r = await fetch(`${PHOTON_ENDPOINT}?${params}`, { signal });
    if (!r.ok) return [];
    const data = await r.json();
    const features: any[] = data?.features ?? [];

    const out: LocationSuggestion[] = [];
    const seen = new Set<string>();

    for (const f of features) {
      const p = f?.properties ?? {};
      if (p.country !== "India") continue;

      const type: string = p.type ?? p.osm_value ?? "";
      const name: string = p.name ?? "";
      if (!name) continue;

      const cityVal: string = p.city ?? p.county ?? "";
      const state: string = p.state ?? "";
      const coords: Coords | undefined =
        f.geometry?.coordinates
          ? { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }
          : undefined;

      // Decide if this is a city-level or area-level result
      const isCityLevel = ALLOWED_CITY_TYPES.has(type) && !cityVal;
      const isAreaLevel = ALLOWED_AREA_TYPES.has(type) && !!cityVal;

      if (isCityLevel) {
        const key = `city:${name.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          type: "city",
          city: name,
          displayName: name,
          badge: "City",
          coords,
        });
      } else if (isAreaLevel) {
        const key = `area:${name.toLowerCase()}:${cityVal.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          type: "area",
          city: cityVal,
          area: name,
          displayName: `${name}, ${cityVal}`,
          badge: "Area",
          coords,
        });
      }
    }

    const top = out.slice(0, 8);
    cache.set(cacheKey, top);
    return top;
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    return [];
  }
}

// ---- Public API -------------------------------------------------------------

/**
 * Search for location suggestions combining:
 *  1. Instant static results (our curated cities + areas list)
 *  2. Live Photon/OSM results (debounced by the caller)
 *
 * Returns { instant, live } so the UI can show instant results immediately
 * then upgrade to live results when the API responds.
 */
export async function searchLocations(
  query: string,
  options: { bias?: Coords | null; signal?: AbortSignal } = {},
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  // Merge static + live, deduplicated by displayName
  const stat = staticSuggestions(q);
  let live: LocationSuggestion[] = [];
  try {
    live = await photonSearch(q, options.bias, options.signal);
  } catch {
    // AbortError or network — static results are still valid
  }

  const seen = new Set(stat.map((s) => s.displayName.toLowerCase()));
  const merged = [
    ...stat,
    ...live.filter((l) => !seen.has(l.displayName.toLowerCase())),
  ].slice(0, 10);

  return merged;
}

/** Get the static instant suggestions only (no network, zero latency). */
export function getInstantLocationSuggestions(query: string): LocationSuggestion[] {
  return staticSuggestions(query);
}

/** Build a LocationSelection from a city-only string (e.g. from CityPicker). */
export function citySelection(city: string): LocationSelection {
  return { type: "city", city, displayName: city };
}
