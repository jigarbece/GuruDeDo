import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

const STEPS = [
  { icon: "🔍", title: "Dhundho", desc: "Search by skill + area", color: "#5B2C8C" },
  { icon: "👤", title: "Dekho", desc: "View profile, fee, experience", color: "#E63946" },
  { icon: "💬", title: "Baat Karo", desc: "Connect directly on WhatsApp", color: "#1FA9B3" },
];

function Step({
  icon, title, desc, color, delay,
}: (typeof STEPS)[number] & { delay: number }) {
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
      style={{ opacity, transform: [{ translateY }], borderColor: color }}
      className="w-full items-center rounded-2xl border-2 bg-white p-6 md:flex-1"
    >
      <View
        style={{ backgroundColor: color + "22" }}
        className="h-16 w-16 items-center justify-center rounded-full"
      >
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text
        style={{ color }}
        className="mt-3 font-heading text-xl font-bold"
      >
        {title}
      </Text>
      <Text className="mt-1 text-center font-body text-sm text-text-muted">{desc}</Text>
    </Animated.View>
  );
}

export default function HowItWorks() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <View className="w-full flex-col gap-4 md:flex-row">
      {mounted &&
        STEPS.map((s, i) => <Step key={s.title} {...s} delay={i * 200} />)}
    </View>
  );
}
