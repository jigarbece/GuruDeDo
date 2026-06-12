import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import SkillAutocomplete from "./SkillAutocomplete";
import LocationAutocomplete, { type LocationSelection } from "./LocationAutocomplete";
import { useCoords } from "../lib/city";

interface Props {
  initialSkill?: string;
  initialLocation?: LocationSelection | null;
  onSearch: (skill: string, location: LocationSelection | null) => void;
}

export default function SearchBar({ initialSkill = "", initialLocation = null, onSearch }: Props) {
  const [skill, setSkill] = useState(initialSkill);
  const [locationText, setLocationText] = useState(initialLocation?.displayName ?? "");
  const [location, setLocation] = useState<LocationSelection | null>(initialLocation);
  const coords = useCoords();

  const handleLocationChange = (text: string) => {
    setLocationText(text);
    // If the user clears or changes the text after picking, invalidate the selection
    // so we don't search with a stale location object.
    if (location && text !== location.displayName) {
      setLocation(null);
    }
  };

  const submit = () => {
    // If the user typed something but didn't pick a suggestion, treat their
    // raw text as a city search (best-effort). This prevents the "" / null
    // location falling back to Ahmedabad in the search page.
    const effectiveLocation: LocationSelection | null =
      location ??
      (locationText.trim()
        ? { type: "city", city: locationText.trim(), displayName: locationText.trim() }
        : null);

    onSearch(skill.trim(), effectiveLocation);
  };

  return (
    <View
      style={{ zIndex: 110, position: "relative" }}
      className="w-full rounded-2xl bg-white p-2 shadow-sm"
    >
      <View className="flex-col gap-2 md:flex-row md:items-center">
        {/* Skill input with live suggestions */}
        <SkillAutocomplete
          value={skill}
          onChangeText={setSkill}
          onSelect={(s) => setSkill(s)}
          onSubmitEditing={submit}
          placeholder="Guitar, Yoga, Math..."
        />

        {/* Location — city or area/locality */}
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
