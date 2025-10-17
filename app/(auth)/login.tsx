import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme';
import AppTopBar from '@/components/AppTopBar';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    try {
      setBusy(true);
      await login({ email, password });
    } catch (e: any) {
      Alert.alert('Błąd logowania', e?.message ?? 'Nie udało się zalogować');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppTopBar />
      <View style={styles.content}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bgMuted, color: colors.text }]}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Hasło"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bgMuted, color: colors.text }]}
          secureTextEntry
        />
        <Button title={busy ? 'Logowanie…' : 'Zaloguj'} onPress={handleLogin} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 15 },
});
