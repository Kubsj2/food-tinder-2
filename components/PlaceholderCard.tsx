import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Props = {
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
};

export default function PlaceholderCard({
  onRefresh,
  title = 'Brak kart do wyświetlenia',
  subtitle = 'Spróbuj odświeżyć, aby pobrać nowe propozycje.',
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.emoji}>🍽️</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>

      {onRefresh && (
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onRefresh}>
          <Text style={styles.buttonText}>Odśwież</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
  },
  emoji: { fontSize: 52, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
