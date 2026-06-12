import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import SkillAutocomplete from "./SkillAutocomplete";
import AreaAutocomplete from "./AreaAutocomplete";
import { useCity, useCoords } from "../lib/city";

interface Props {
  initialSkill?: string;
  initialArea?: string;
  onSearch: (skill: string, area: string) => void;
}

export default function SearchBar({ initialSkill = "", initialArea = "", onSearch }: Props) {
  const [skill, setSkill] = useState(initialSkill);
  const [area, setArea] = useState(initialArea);
  const city = useCity();
  const coords = useCoords();

  const submit = () => onSearch(skill.trim(), area.trim());

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
          onSelect={(s) => {
            setSkill(s);
            // Don't auto-submit — let the user also fill in area.
          }}
          onSubmitEditing={submit}
          placeholder="Guitar, Yoga, Math..."
        />

        {/* Area / locality autocomplete */}
        <AreaAutocomplete
          value={area}
          onChangeText={setArea}
          placeholder="Your area or locality"
          cityBias={city}
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
