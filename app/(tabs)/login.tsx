import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { handleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      await handleLogin(email, password);
    } catch (e) {
      setError("Błąd logowania");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Text>Hasło</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <Button title="Zaloguj" onPress={submit} />
    </View>
  );
}
