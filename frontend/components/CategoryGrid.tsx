import { Pressable, Text, View } from "react-native";
import { Colors } from "../constants/colors";
import type { Category } from "../lib/types";

interface Props {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
}

/** Each category tile uses its own vibrant color from the logo's petals. */
function colorForSlug(slug: string): string {
  const map = Colors.category as Record<string, string>;
  return map[slug] ?? Colors.purple;
}

export default function CategoryGrid({ categories, onCategorySelect }: Props) {
  return (
    <View className="flex-row flex-wrap justify-center gap-3">
      {categories.map((cat) => {
        const color = colorForSlug(cat.slug);
        return (
          <Pressable
            key={cat.slug}
            onPress={() => onCategorySelect(cat)}
            style={{ borderColor: color }}
            className="w-[30%] min-w-[110px] max-w-[200px] items-center rounded-2xl border-2 bg-white p-4 active:opacity-80 md:w-[22%]"
          >
            <View
              style={{ backgroundColor: color + "22" }}
              className="h-14 w-14 items-center justify-center rounded-full"
            >
              <Text className="text-3xl">{cat.icon}</Text>
            </View>
            <Text
              style={{ color }}
              className="mt-2 text-center font-heading text-sm font-bold"
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
