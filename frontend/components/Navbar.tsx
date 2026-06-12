import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Link, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { useCity } from "../lib/city";
import CityPicker from "./CityPicker";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/register", label: "Register as Coach" },
  { href: "/admin", label: "Admin" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const city = useCity();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <View className="w-full border-b border-brand-border bg-white">
      <View className="mx-auto w-full max-w-6xl flex-row items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" asChild>
          <Pressable className="flex-row items-center gap-2">
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
            <View>
              <Text className="font-heading text-xl font-extrabold text-purple">
                Gurudedo
              </Text>
              <Text className="font-body text-[10px] text-text-muted">
                Find the Right Teacher
              </Text>
            </View>
          </Pressable>
        </Link>

        {/* Right side */}
        <View className="flex-row items-center gap-3">
          {/* City chip — always visible */}
          <Pressable
            onPress={() => setPickerOpen(true)}
            className="flex-row items-center gap-1 rounded-full bg-purple/10 px-3 py-1.5"
          >
            <Ionicons name="location-outline" size={14} color={Colors.purple} />
            <Text className="font-heading text-sm font-semibold text-purple" numberOfLines={1}>
              {city}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.purple} />
          </Pressable>

          {/* Desktop links */}
          <View className="hidden flex-row items-center gap-6 md:flex">
            {LINKS.slice(0, 2).map((l) => (
              <Link key={l.href} href={l.href} asChild>
                <Pressable>
                  <Text
                    className={`font-body text-base ${
                      isActive(l.href) ? "font-semibold text-purple" : "text-text-dark"
                    }`}
                  >
                    {l.label}
                  </Text>
                </Pressable>
              </Link>
            ))}
            <Link href="/admin" asChild>
              <Pressable>
                <Text className="font-body text-base text-text-muted">Admin</Text>
              </Pressable>
            </Link>
            <Pressable
              onPress={() => router.push("/register")}
              className="rounded-full bg-red px-5 py-2 active:opacity-80"
            >
              <Text className="font-heading font-semibold text-white">Register as Coach</Text>
            </Pressable>
          </View>

          {/* Mobile hamburger */}
          <Pressable className="md:hidden" onPress={() => setOpen((v) => !v)}>
            <Ionicons name={open ? "close" : "menu"} size={28} color={Colors.purple} />
          </Pressable>
        </View>
      </View>

      {/* Mobile drawer */}
      {open && (
        <View className="border-t border-brand-border bg-white px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} asChild>
              <Pressable onPress={() => setOpen(false)} className="py-3">
                <Text
                  className={`font-body text-base ${
                    isActive(l.href) ? "font-semibold text-purple" : "text-text-dark"
                  }`}
                >
                  {l.label}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      <CityPicker visible={pickerOpen} current={city} onClose={() => setPickerOpen(false)} />
    </View>
  );
}
