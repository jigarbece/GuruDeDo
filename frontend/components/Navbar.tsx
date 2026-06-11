import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";

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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <View className="w-full border-b border-brand-border bg-white">
      <View className="mx-auto w-full max-w-6xl flex-row items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" asChild>
          <Pressable>
            <Text className="font-heading text-2xl font-bold text-saffron">
              guru<Text className="text-navy">•</Text>de<Text className="text-navy">•</Text>do
            </Text>
          </Pressable>
        </Link>

        {/* Desktop links */}
        <View className="hidden flex-row items-center gap-6 md:flex">
          {LINKS.slice(0, 2).map((l) => (
            <Link key={l.href} href={l.href} asChild>
              <Pressable>
                <Text
                  className={`font-body text-base ${
                    isActive(l.href) ? "font-semibold text-saffron" : "text-navy"
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
            className="rounded-full border-2 border-saffron px-5 py-2"
          >
            <Text className="font-heading font-semibold text-saffron">Register as Coach</Text>
          </Pressable>
        </View>

        {/* Mobile hamburger */}
        <Pressable className="md:hidden" onPress={() => setOpen((v) => !v)}>
          <Ionicons name={open ? "close" : "menu"} size={28} color={Colors.navy} />
        </Pressable>
      </View>

      {/* Mobile drawer */}
      {open && (
        <View className="border-t border-brand-border bg-white px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} asChild>
              <Pressable onPress={() => setOpen(false)} className="py-3">
                <Text
                  className={`font-body text-base ${
                    isActive(l.href) ? "font-semibold text-saffron" : "text-navy"
                  }`}
                >
                  {l.label}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}
