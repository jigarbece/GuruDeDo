import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface Props {
  initialSkill?: string;
  initialArea?: string;
  onSearch: (skill: string, area: string) => void;
}

export default function SearchBar({ initialSkill = "", initialArea = "", onSearch }: Props) {
  const [skill, setSkill] = useState(initialSkill);
  const [area, setArea] = useState(initialArea);

  const submit = () => onSearch(skill.trim(), area.trim());

  return (
    <View className="w-full flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm md:flex-row md:items-center">
      <TextInput
        value={skill}
        onChangeText={setSkill}
        placeholder="Guitar, Yoga, Math..."
        placeholderTextColor="#9CA3AF"
        onSubmitEditing={submit}
        className="flex-1 rounded-xl border border-brand-border px-4 py-3 font-body text-base text-text-dark"
      />
      <TextInput
        value={area}
        onChangeText={setArea}
        placeholder="Your area or locality"
        placeholderTextColor="#9CA3AF"
        onSubmitEditing={submit}
        className="flex-1 rounded-xl border border-brand-border px-4 py-3 font-body text-base text-text-dark"
      />
      <Pressable
        onPress={submit}
        className="items-center justify-center rounded-xl bg-red px-8 py-3 active:opacity-80"
      >
        <Text className="font-heading text-base font-semibold text-white">Search</Text>
      </Pressable>
    </View>
  );
}
