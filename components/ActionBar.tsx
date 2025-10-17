import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/lib/theme';

type Props = {
  onDislike: () => void;
  onInfo: () => void;
  onLike: () => void;
  disabled?: boolean;
};

export default function ActionBar({ onDislike, onInfo, onLike, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onDislike}
        disabled={disabled}
        style={[styles.btn, { backgroundColor: colors.bgMuted, borderColor: colors.border }]}
      >
        <Ionicons name="close" size={28} style={{color: colors.primary}} />
      </Pressable>
      <Pressable
        onPress={onInfo}
        disabled={disabled}
        style={[styles.btnLg, { backgroundColor: colors.bgMuted, borderColor: colors.border }]}
      >
        <Ionicons name="information-circle" size={32} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={onLike}
        disabled={disabled}
        style={[styles.btn, { backgroundColor: colors.bgMuted, borderColor: colors.border }]}
      >
        <Ionicons name="heart" size={28} style={{color: colors.secondary}} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnLg: {
    width: 84,
    height: 84,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
