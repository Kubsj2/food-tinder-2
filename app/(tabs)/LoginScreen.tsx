import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_URL = "http://127.0.0.1:8000/api/login"; // ← zmień na swój endpoint

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState<any>(null);

  const handleLogin = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Błąd ${res.status}: ${text}`);
      }

      const data = await res.json();
        await AsyncStorage.setItem("token", data.token);
        console.log("Token zapisany:", data.token);
      setResponse(data);
      Alert.alert("Zalogowano!", JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error(error);
      Alert.alert("Błąd logowania", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logowanie</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Hasło"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button title="Zaloguj" onPress={handleLogin} />
      {response && (
        <Text style={styles.response}>{JSON.stringify(response, null, 2)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  response: {
    marginTop: 20,
    fontFamily: "monospace",
  },
});
