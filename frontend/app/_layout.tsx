import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Navbar from "../components/Navbar";
import { detectCityFromBrowser, hasStoredCity, setCity } from "../lib/city";

export default function RootLayout() {
  // On first visit (no stored city), try to detect from browser geolocation.
  // Silent — if the user denies, declines, or the lookup fails, we keep the
  // default city ("Ahmedabad") and they can change it via the navbar chip.
  useEffect(() => {
    if (hasStoredCity()) return;
    detectCityFromBrowser().then((c) => {
      if (c) setCity(c);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-cream">
        <Navbar />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFFBF5" },
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}
