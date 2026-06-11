import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

const STEPS = [
  { icon: "🔍", title: "Dhundho", desc: "Search by skill + area" },
  { icon: "👤", title: "Dekho", desc: "View coach profile, fee, experience" },
  { icon: "💬", title: "Baat Karo", desc: "Connect directly on WhatsApp" },
];

function Step({ icon, title, desc, delay }: (typeof STEPS)[number] & { delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
      className="w-full items-center rounded-2xl border border-brand-border bg-white p-6 md:flex-1"
    >
      <View className="h-16 w-16 items-center justify-center rounded-full bg-cream">
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text className="mt-3 font-heading text-xl font-bold text-navy">{title}</Text>
      <Text className="mt-1 text-center font-body text-sm text-text-muted">{desc}</Text>
    </Animated.View>
  );
}

export default function HowItWorks() {
  // Stagger the entrance once mounted (web has no IntersectionObserver wiring here,
  // so we trigger on mount which is fine for an above-the-fold-ish section).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <View className="w-full flex-col gap-4 md:flex-row">
      {mounted &&
        STEPS.map((s, i) => <Step key={s.title} {...s} delay={i * 200} />)}
    </View>
  );
}
