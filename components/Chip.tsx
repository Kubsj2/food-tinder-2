import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

export default function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.bgMuted, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
