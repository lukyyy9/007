import { Controller, Control } from "react-hook-form";
import { TextInput, View, Text } from "react-native";

type Props = {
  control: Control<any>;
  name: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export default function FormTextInput({
  control,
  name,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
}: Props) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ marginBottom: 12 }}>
          <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            style={{
              borderWidth: 1,
              borderColor: error ? "crimson" : "#ccc",
              borderRadius: 8,
              padding: 12,
            }}
          />
          {error && (
            <Text style={{ color: "crimson", marginTop: 6 }}>{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}