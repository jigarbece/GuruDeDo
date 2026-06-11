import "../global.css";
import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Navbar from "../components/Navbar";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-cream">
        <Navbar />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFF8F0" },
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}
