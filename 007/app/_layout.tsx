import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Login from "./_login";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import AuthProvider from "@/providers/AuthProvider";
import { HeaderShownContext } from "@react-navigation/elements";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Slot screenOptions={{HeaderShownContext: false}} />
      </AuthProvider>
    </ThemeProvider>
  );
}
