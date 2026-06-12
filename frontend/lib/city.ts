import { useEffect, useState } from "react";

// Shared "current city" state for the whole app.
// Persisted in localStorage so it survives reloads; broadcast via a tiny
// pub-sub so every page using useCity() re-renders when it changes.

const STORAGE_KEY = "gurudedo_city";
export const DEFAULT_CITY = "Ahmedabad";

function readStored(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeStored(c: string) {
  try {
    if (typeof window !== "undefined") window.localStorage?.setItem(STORAGE_KEY, c);
  } catch {
    /* localStorage can throw in private mode — non-fatal */
  }
}

let _city: string = readStored() ?? DEFAULT_CITY;
const _listeners = new Set<(c: string) => void>();

export function getCity(): string {
  return _city;
}

export function setCity(c: string) {
  const trimmed = c.trim();
  if (!trimmed || trimmed === _city) return;
  _city = trimmed;
  writeStored(trimmed);
  _listeners.forEach((fn) => fn(trimmed));
}

export function hasStoredCity(): boolean {
  return readStored() !== null;
}

/** React hook that re-renders the caller when the current city changes. */
export function useCity(): string {
  const [c, setC] = useState(_city);
  useEffect(() => {
    const fn = (nc: string) => setC(nc);
    _listeners.add(fn);
    return () => {
      _listeners.delete(fn);
    };
  }, []);
  return c;
}

/**
 * Asks the browser for the user's location (HTTPS only, requires permission)
 * and reverse-geocodes via BigDataCloud's free, key-less endpoint.
 * Returns the detected city or null if anything fails.
 */
export async function detectCityFromBrowser(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 600_000, // accept a 10-min-old fix; we don't need precision
        enableHighAccuracy: false,
      });
    });
    const { latitude, longitude } = pos.coords;
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return (data.city || data.locality || data.principalSubdivision || null) as string | null;
  } catch {
    return null;
  }
}
