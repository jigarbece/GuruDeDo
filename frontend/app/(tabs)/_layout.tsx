import { Stack } from "expo-router";

// The (tabs) group holds the primary public pages (home + search).
// It renders as a headerless stack nested inside the root layout's navbar.
export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
