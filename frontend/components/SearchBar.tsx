import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import SkillAutocomplete from "./SkillAutocomplete";
import MultiLocationSelector from "./MultiLocationSelector";
import { useCoords } from "../lib/city";
import { type LocationSelection } from "../lib/location";

interface Props {
  initialSkill?: string;
  initialLocations?: LocationSelection[];
  onSearch: (skill: string, locations: LocationSelection[]) => void;
}

export default function SearchBar({
  initialSkill = "",
  initialLocations = [],
  onSearch,
}: Props) {
  const [skill, setSkill] = useState(initialSkill);
  const [locations, setLocations] = useState<LocationSelection[]>(initialLocations);
  const coords = useCoords();

  const closeSkillRef = useRef<(() => void) | null>(null);
  const closeLocationRef = useRef<(() => void) | null>(null);

  const submit = () => {
    closeSkillRef.current?.();
    closeLocationRef.current?.();
    onSearch(skill.trim(), locations);
  };

  return (
    <View
      style={{ zIndex: 110, position: "relative" }}
      className="w-full rounded-2xl bg-white p-2 shadow-sm"
    >
      <View className="flex-col gap-2 md:flex-row md:items-stretch">
        <SkillAutocomplete
          value={skill}
          onChangeText={setSkill}
          onSelect={(s) => setSkill(s)}
          onSubmitEditing={submit}
          placeholder="Guitar, Yoga, Math..."
          closeRef={closeSkillRef}
        />

        <MultiLocationSelector
          values={locations}
          onChange={setLocations}
          placeholder="City or area (e.g. Bopal, Satellite, Mumbai)"
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
