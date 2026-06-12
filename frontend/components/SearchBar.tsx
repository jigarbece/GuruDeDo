import { useRef, useState } from "react";
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

function resolveRawText(raw: string): LocationSelection {
  const t = raw.trim();
  const cityMatch = MAJOR_INDIAN_CITIES.find((c) => c.toLowerCase() === t.toLowerCase());
  if (cityMatch) return { type: "city", city: cityMatch, displayName: cityMatch };

  const ci = t.indexOf(",");
  if (ci > 0) {
    const a = t.slice(0, ci).trim();
    const c = t.slice(ci + 1).trim();
    if (c) return { type: "area", city: c, area: a, displayName: t };
  }

  for (const [city, areas] of Object.entries(AREAS_BY_CITY)) {
    const m = areas.find((a) => a.toLowerCase() === t.toLowerCase());
    if (m) return { type: "area", city, area: m, displayName: `${m}, ${city}` };
  }
  for (const [city, areas] of Object.entries(AREAS_BY_CITY)) {
    const m = areas.find((a) => a.toLowerCase().includes(t.toLowerCase()));
    if (m) return { type: "area", city, area: m, displayName: `${m}, ${city}` };
  }

  return { type: "city", city: t, displayName: t };
}

export default function SearchBar({ initialSkill = "", initialLocation = null, onSearch }: Props) {
  const [skill, setSkill] = useState(initialSkill);
  const [locationText, setLocationText] = useState(initialLocation?.displayName ?? "");
  const [location, setLocation] = useState<LocationSelection | null>(initialLocation);
  const coords = useCoords();

  // Refs that child components expose — calling them force-closes their dropdowns
  const closeSkillRef = useRef<(() => void) | null>(null);
  const closeLocationRef = useRef<(() => void) | null>(null);

  const handleLocationChange = (text: string) => {
    setLocationText(text);
    if (location && text !== location.displayName) setLocation(null);
  };

  const submit = () => {
    // Close both dropdowns immediately
    closeSkillRef.current?.();
    closeLocationRef.current?.();

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
          closeRef={closeSkillRef}
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
          closeRef={closeLocationRef}
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
