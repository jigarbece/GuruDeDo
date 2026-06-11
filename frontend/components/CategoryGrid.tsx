import { Pressable, Text, View } from "react-native";
import type { Category } from "../lib/types";

interface Props {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
}

export default function CategoryGrid({ categories, onCategorySelect }: Props) {
  return (
    <View className="flex-row flex-wrap justify-center gap-3">
      {categories.map((cat) => (
        <Pressable
          key={cat.slug}
          onPress={() => onCategorySelect(cat)}
          className="w-[30%] min-w-[100px] max-w-[200px] items-center rounded-2xl border border-brand-border bg-white p-4 active:bg-cream md:w-[22%]"
        >
          <Text className="text-4xl">{cat.icon}</Text>
          <Text className="mt-2 text-center font-heading text-sm font-semibold text-navy">
            {cat.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
