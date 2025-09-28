import { Slot, Redirect } from "expo-router";
import { useAuthSession } from "@/providers/AuthProvider";

export default function LoginLayout() {
  const { token, isLoading } = useAuthSession();
  if (isLoading) return null;
  if (token) return <Redirect href="/_(authorized)/(tabs)" />;
  return <Slot />;
}
