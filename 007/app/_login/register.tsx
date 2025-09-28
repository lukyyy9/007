import { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuthSession } from "@/providers/AuthProvider";
import FormTextInput from "@/components/FormTextInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RegisterForm, registerSchema } from "@/scripts/validatorAuth";

export default function Register() {
  const { register } = useAuthSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, watch, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onRegister = async (data: RegisterForm) => {
    try {
      setBusy(true);
      await register(data.username.trim(), data.email.trim(), data.password);
    } catch (e: any) {
      setError(e?.response?.data?.details ?? e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "600", textAlign: "center" }}>Inscription</Text>
      <FormTextInput
        control={control}
        placeholder="Nom d'utilisateur"
        name="username"
        
      />
      <FormTextInput
        control={control}
        placeholder="Email"
        autoCapitalize="none"
        name="email"
        keyboardType="email-address"
      />
      <FormTextInput
        control={control}
        placeholder="Mot de passe"
        secureTextEntry
        name="password"
      />
      <FormTextInput
        control={control}
        placeholder="Confirmer le mot de passe"
        secureTextEntry
        name="confirmPassword"
      />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <Button
        title={busy ? "..." : "Créer mon compte"}
        onPress={handleSubmit(onRegister)}
        disabled={!formState.isValid || busy}
      />
      <Text style={{ marginTop: 12, textAlign: "center" }}>
        Déjà inscrit ?{" "}
        <Link href="/_login" style={{ fontWeight: "600", color: "#007AFF" }}>
          Se connecter
        </Link>
      </Text>
    </View>
  );
}
