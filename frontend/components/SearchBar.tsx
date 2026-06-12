import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import SkillAutocomplete from "./SkillAutocomplete";
import LocationAutocomplete, { type LocationSelection } from "./LocationAutocomplete";
import { useCoords } from "../lib/city";
import { MAJOR_INDIAN_CITIES, AREAS_BY_CITY } from "../constants/categories";

interface Props {
  initialSkill?: string;
  initialLocation?: LocationSelection | null;
  onSearch: (skill: string, location: LocationSelection | null) => void;
}

/**
 * Resolve raw free-text to a LocationSelection.
 *
 * Priority:
 * 1. Exact city match (case-insensitive)   → type="city"
 * 2. "Area, City" comma format             → type="area"
 * 3. Known area in our data               → type="area" with its parent city
 * 4. Fallback: treat as city              → type="city" (backend will ilike both cols)
 */
function resolveRawText(raw: string): LocationSelection {
  const trimmed = raw.trim();

  // 1. Exact city match
  const cityMatch = MAJOR_INDIAN_CITIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (cityMatch) return { type: "city", city: cityMatch, displayName: cityMatch };

  // 2. "Area, City" comma format
  const commaIdx = trimmed.indexOf(",");
  if (commaIdx > 0) {
    const areaPart = trimmed.slice(0, commaIdx).trim();
    const cityPart = trimmed.slice(commaIdx + 1).trim();
    if (cityPart) {
      return { type: "area", city: cityPart, area: areaPart, displayName: trimmed };
    }
  }

  // 3. Known area anywhere in our dataset
  for (const [city, areas] of Object.entries(AREAS_BY_CITY)) {
    const areaMatch = areas.find((a) => a.toLowerCase() === trimmed.toLowerCase());
    if (areaMatch) {
      return {
        type: "area",
        city,
        area: areaMatch,
        displayName: `${areaMatch}, ${city}`,
      };
    }
  }

  // 4. Partial area match (e.g. "bop" → "Bopal, Ahmedabad")
  for (const [city, areas] of Object.entries(AREAS_BY_CITY)) {
    const areaMatch = areas.find((a) =>
      a.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (areaMatch) {
      return {
        type: "area",
        city,
        area: areaMatch,
        displayName: `${areaMatch}, ${city}`,
      };
    }
  }

  // 5. Fallback — send as city; backend will OR against area column too
  return { type: "city", city: trimmed, displayName: trimmed };
}

export default function SearchBar({ initialSkill = "", initialLocation = null, onSearch }: Props) {
  const [skill, setSkill] = useState(initialSkill);
  const [locationText, setLocationText] = useState(initialLocation?.displayName ?? "");
  const [location, setLocation] = useState<LocationSelection | null>(initialLocation);
  const coords = useCoords();

  const handleLocationChange = (text: string) => {
    setLocationText(text);
    // Invalidate picked selection when user edits the text
    if (location && text !== location.displayName) {
      setLocation(null);
    }
  };

  const submit = () => {
    // Use the picked location if available; otherwise resolve the raw text
    const effectiveLocation: LocationSelection | null =
      location ?? (locationText.trim() ? resolveRawText(locationText) : null);
    onSearch(skill.trim(), effectiveLocation);
  };

  return (
    <View
      style={{ zIndex: 110, position: "relative" }}
      className="w-full rounded-2xl bg-white p-2 shadow-sm"
    >
      <View className="flex-col gap-2 md:flex-row md:items-center">
        <SkillAutocomplete
          value={skill}
          onChangeText={setSkill}
          onSelect={(s) => setSkill(s)}
          onSubmitEditing={submit}
          placeholder="Guitar, Yoga, Math..."
        />

        <LocationAutocomplete
          value={locationText}
          onChangeText={handleLocationChange}
          onSelect={(loc) => {
            setLocation(loc);
            setLocationText(loc.displayName);
          }}
          placeholder="City or area (e.g. Ahmedabad, Bopal)"
          coordBias={coords}
          onSubmitEditing={submit}
          wrapperClassName="md:flex-1"
        />

        <Pressable
          onPress={submit}
          className="items-center justify-center rounded-xl bg-red px-6 py-3 active:opacity-80"
        >
          <Text className="font-heading text-base font-semibold text-white">Search</Text>
        </Pressable>
      </View>
    </View>
  );
}
