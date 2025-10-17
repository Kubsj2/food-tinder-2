import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import AppTopBar from '@/components/AppTopBar';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { email, logout } = useAuth();
  const [busyReset, setBusyReset] = useState(false);
  const [busyLogout, setBusyLogout] = useState(false);

  const handleChangePassword = async () => {
    try {
      if (!email) {
        Alert.alert('Błąd', 'Brak adresu e-mail. Zaloguj się ponownie.');
        return;
      }
      setBusyReset(true);
      await api.forgotPassword(email);
      Alert.alert('OK', 'Wysłano link do zmiany hasła na e-mail.');
    } catch (e: any) {
      Alert.alert('Błąd', e?.message ?? 'Nie udało się wysłać linku.');
    } finally {
      setBusyReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      setBusyLogout(true);
      await logout();
    } finally {
      setBusyLogout(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <AppTopBar />
      <View style={styles.body}>
        <Text style={[styles.email, { color: colors.text }]}>{email ?? 'Brak e-maila'}</Text>
        <View style={styles.spacer} />
        <Button title={busyReset ? 'Wysyłanie…' : 'Zmień hasło'} onPress={handleChangePassword} disabled={busyReset} />
        <View style={styles.gap} />
        <Button title={busyLogout ? 'Wylogowywanie…' : 'Wyloguj'} color={colors.primary} onPress={handleLogout} disabled={busyLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 20, justifyContent: 'center' },
  email: { marginTop: 8, textAlign: 'center' },
  spacer: { height: 24 },
  gap: { height: 12 },
});
