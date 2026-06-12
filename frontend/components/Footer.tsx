import { Image, Linking, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/register", label: "Register as Coach" },
  { href: "/admin", label: "Admin" },
] as const;

export default function Footer() {
  return (
    <View className="w-full bg-purple px-4 py-10">
      <View className="mx-auto w-full max-w-6xl items-center gap-4">
        <Image
          source={require("../assets/logo-side.png")}
          style={{ width: 64, height: 64 }}
          resizeMode="contain"
        />
        <Text className="font-heading text-2xl font-extrabold text-white">
          Gurudedo
        </Text>
        <Text className="font-body text-sm text-white/90">
          Guru chahiye? Gurudedo!
        </Text>
        <Text className="font-heading text-sm font-semibold text-pink">
          Find the Right Teacher. Learn Any Skill.
        </Text>

        <View className="flex-row flex-wrap justify-center gap-5">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} asChild>
              <Pressable>
                <Text className="font-body text-sm text-white/90">{l.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <Pressable onPress={() => Linking.openURL("mailto:hello@gurudedo.com")}>
          <Text className="font-body text-sm text-pink">hello@gurudedo.com</Text>
        </Pressable>

        <Text className="text-center font-body text-xs text-white/60">
          © 2026 Gurudedo | Made with ❤️ in Ahmedabad 🇮🇳
        </Text>
      </View>
    </View>
  );
}
