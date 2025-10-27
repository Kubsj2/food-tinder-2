// app/settings.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/lib/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const close = () => router.back();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}>
      <Pressable onPress={close} style={[styles.closeBtn, { top: insets.top + 8 }]} hitSlop={8}>
        <Ionicons name="close" size={26} color={colors.text} />
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>Ustawienia</Text>

      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Powiadomienia</Text>

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Push</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} />
        </View>

        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Marketing</Text>
          <Switch value={marketingEnabled} onValueChange={setMarketingEnabled} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  closeBtn: { position: 'absolute', left: 12, zIndex: 10, padding: 6, borderRadius: 999 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 8, marginBottom: 16 },
  section: { borderWidth: 1, borderRadius: 16, padding: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 16, fontWeight: '600' },
});
