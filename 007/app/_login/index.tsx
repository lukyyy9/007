import { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuthSession } from "@/providers/AuthProvider";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginForm } from "@/scripts/validatorAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import FormTextInput from "@/components/FormTextInput";

export default function Login() {
  const { signIn } = useAuthSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onChange", // validation live
  });

  const onLogin = async (data: LoginForm) => {
    try {
      setBusy(true);
      await signIn(data.username.trim(), data.password);
    } catch (e: any) {
      console.log(e);

      setError(e?.response?.data?.error ?? e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: "center" }}>
      <Text
        style={{
          width: "70%",
          marginHorizontal: "auto",
          fontSize: 20,
          fontWeight: "600",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Bienvenue agent 007, 
        {"\n"}
        ta mission commence après authentification.
      </Text>
      <FormTextInput
        control={control}
        name="username"
        placeholder="Nom d'utilisateur ou email"
        autoCapitalize="none"
      />
      <FormTextInput
        control={control}
        name="password"
        placeholder="Mot de passe"
        secureTextEntry
      />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <Button
        title={busy ? "..." : "Se connecter"}
        onPress={handleSubmit(onLogin)}
        disabled={!formState.isValid || busy}
      />
      <Text style={{ marginTop: 12, textAlign: "center" }}>
        Nouvelle recrue ?{" "}
        <Link
          href="/_login/register"
          style={{ fontWeight: "600", color: "#007AFF" }}
        >
          Inscription
        </Link>
      </Text>
    </View>
  );
}
