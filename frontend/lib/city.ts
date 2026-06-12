import { useEffect, useState } from "react";

// Shared "current city" + "current coords" state for the whole app.
// Persisted in localStorage so they survive reloads; broadcast via a tiny
// pub-sub so every page using useCity() / useCoords() re-renders on change.

const CITY_KEY = "gurudedo_city";
const COORDS_KEY = "gurudedo_coords";
export const DEFAULT_CITY = "Ahmedabad";

export interface Coords {
  lat: number;
  lon: number;
}

// Approximate centroids for major Indian metros. Used as a fallback bias
// when the user manually picks a city from the picker but we don't have
// their actual geolocation.
export const CITY_COORDS: Record<string, Coords> = {
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Mumbai: { lat: 19.076, lon: 72.8777 },
  Pune: { lat: 18.5204, lon: 73.8567 },
  Bangalore: { lat: 12.9716, lon: 77.5946 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Delhi: { lat: 28.7041, lon: 77.1025 },
  Gurgaon: { lat: 28.4595, lon: 77.0266 },
  Noida: { lat: 28.5355, lon: 77.391 },
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Jaipur: { lat: 26.9124, lon: 75.7873 },
  Surat: { lat: 21.1702, lon: 72.8311 },
  Vadodara: { lat: 22.3072, lon: 73.1812 },
  Rajkot: { lat: 22.3039, lon: 70.8022 },
  Indore: { lat: 22.7196, lon: 75.8577 },
  Bhopal: { lat: 23.2599, lon: 77.4126 },
  Nagpur: { lat: 21.1458, lon: 79.0882 },
  Lucknow: { lat: 26.8467, lon: 80.9462 },
  Chandigarh: { lat: 30.7333, lon: 76.7794 },
  Kochi: { lat: 9.9312, lon: 76.2673 },
};

// ---- localStorage helpers ----------------------------------------------------

function readStoredCity(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage?.getItem(CITY_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeStoredCity(c: string) {
  try {
    if (typeof window !== "undefined") window.localStorage?.setItem(CITY_KEY, c);
  } catch {
    /* private mode etc. — non-fatal */
  }
}

function readStoredCoords(): Coords | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage?.getItem(COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === "number" && typeof parsed?.lon === "number") {
      return { lat: parsed.lat, lon: parsed.lon };
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredCoords(c: Coords | null) {
  try {
    if (typeof window === "undefined") return;
    if (c) window.localStorage?.setItem(COORDS_KEY, JSON.stringify(c));
    else window.localStorage?.removeItem(COORDS_KEY);
  } catch {
    /* non-fatal */
  }
}

// ---- City state --------------------------------------------------------------

let _city: string = readStoredCity() ?? DEFAULT_CITY;
let _coords: Coords | null = readStoredCoords();

const _cityListeners = new Set<(c: string) => void>();
const _coordsListeners = new Set<(c: Coords | null) => void>();

export function getCity(): string {
  return _city;
}

export function getCoords(): Coords | null {
  return _coords;
}

export function setCity(c: string) {
  const trimmed = c.trim();
  if (!trimmed) return;
  if (trimmed !== _city) {
    _city = trimmed;
    writeStoredCity(trimmed);
    _cityListeners.forEach((fn) => fn(trimmed));
  }
  // If the picked city matches a known metro, default coords to its centroid.
  // This keeps autocomplete biased toward the right metro when the user picks
  // from the popular-cities list rather than using geolocation.
  const known = CITY_COORDS[trimmed];
  if (known) setCoords(known);
}

export function setCoords(c: Coords | null) {
  // Avoid spurious updates if values are identical.
  if (
    (c === null && _coords === null) ||
    (c && _coords && c.lat === _coords.lat && c.lon === _coords.lon)
  ) {
    return;
  }
  _coords = c;
  writeStoredCoords(c);
  _coordsListeners.forEach((fn) => fn(c));
}

export function hasStoredCity(): boolean {
  return readStoredCity() !== null;
}

/** React hook — re-renders the caller when the current city changes. */
export function useCity(): string {
  const [c, setC] = useState(_city);
  useEffect(() => {
    const fn = (nc: string) => setC(nc);
    _cityListeners.add(fn);
    return () => {
      _cityListeners.delete(fn);
    };
  }, []);
  return c;
}

/** React hook — re-renders the caller when current coords change. */
export function useCoords(): Coords | null {
  const [c, setC] = useState(_coords);
  useEffect(() => {
    const fn = (nc: Coords | null) => setC(nc);
    _coordsListeners.add(fn);
    return () => {
      _coordsListeners.delete(fn);
    };
  }, []);
  return c;
}

// ---- Browser geolocation -----------------------------------------------------

/**
 * Asks the browser for the user's location and reverse-geocodes it.
 * Saves the actual lat/lon as a side-effect so area autocomplete can bias by
 * the user's TRUE position (not just the city centroid).
 *
 * Returns the resolved city label (or null on failure). If geolocation
 * succeeds but reverse-geocoding fails, the coordinates are still saved and
 * the function returns null — the caller keeps the default city, but the
 * autocomplete still gets a sensible bias.
 */
export async function detectCityFromBrowser(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  let coords: Coords;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 600_000,
        enableHighAccuracy: false,
      });
    });
    coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    return null; // user denied, timed out, or no GPS — nothing to save
  }

  // Save the real coords immediately — even if reverse-geocoding fails below,
  // area autocomplete gets a useful bias.
  setCoords(coords);

  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return (data.city || data.locality || data.principalSubdivision || null) as
      | string
      | null;
  } catch {
    return null;
  }
}
