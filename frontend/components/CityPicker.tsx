import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { MAJOR_INDIAN_CITIES } from "../constants/categories";
import { detectCityFromBrowser, setCity } from "../lib/city";

interface Props {
  visible: boolean;
  current: string;
  onClose: () => void;
}

export default function CityPicker({ visible, current, onClose }: Props) {
  const [text, setText] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText("");
      setError(null);
    }
  }, [visible]);

  const pick = (c: string) => {
    setCity(c);
    onClose();
  };

  const detectNow = async () => {
    setDetecting(true);
    setError(null);
    const c = await detectCityFromBrowser();
    setDetecting(false);
    if (c) pick(c);
    else setError("Could not detect location. Pick from the list or type your city.");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/40 px-4 py-10"
      >
        <Pressable
          onPress={() => {}}
          className="w-full max-w-md rounded-2xl bg-white p-5"
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-heading text-lg font-bold text-purple">Choose your city</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.purple} />
            </Pressable>
          </View>

          {/* Detect button */}
          <Pressable
            onPress={detectNow}
            disabled={detecting}
            className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl border-2 border-teal py-3 ${
              detecting ? "opacity-60" : ""
            }`}
          >
            <Ionicons name="location" size={18} color={Colors.teal} />
            <Text className="font-heading font-semibold text-teal">
              {detecting ? "Detecting…" : "Use my current location"}
            </Text>
          </Pressable>

          {error && (
            <View className="mt-3 rounded-xl bg-red/10 px-3 py-2">
              <Text className="font-body text-xs text-red">{error}</Text>
            </View>
          )}

          {/* Popular cities */}
          <Text className="mb-2 mt-5 font-heading text-sm font-semibold text-text-muted">
            Popular cities
          </Text>
          <ScrollView className="max-h-44" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap gap-2">
              {MAJOR_INDIAN_CITIES.map((c) => {
                const active = c === current;
                return (
                  <Pressable
                    key={c}
                    onPress={() => pick(c)}
                    className={`rounded-full border px-3 py-1.5 ${
                      active ? "border-purple bg-purple" : "border-brand-border bg-white"
                    }`}
                  >
                    <Text className={`text-xs ${active ? "font-semibold text-white" : "text-purple"}`}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Free text */}
          <Text className="mb-2 mt-5 font-heading text-sm font-semibold text-text-muted">
            Or type your city
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="e.g. Coimbatore"
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={() => text.trim() && pick(text)}
              className="flex-1 rounded-xl border border-brand-border px-4 py-3 font-body text-base text-text-dark"
            />
            <Pressable
              onPress={() => text.trim() && pick(text)}
              className="justify-center rounded-xl bg-red px-5"
            >
              <Text className="font-heading font-semibold text-white">Set</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
