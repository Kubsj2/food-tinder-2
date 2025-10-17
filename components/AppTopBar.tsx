import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts, Lobster_400Regular } from '@expo-google-fonts/lobster';
import { useTheme } from '@/lib/theme';

type Props = {
  onPressNotifications?: () => void;
  onPressSettings?: () => void;
  showBorder?: boolean;
};

export default function AppTopBar({ onPressNotifications, onPressSettings, showBorder = true }: Props) {
  const { colors } = useTheme();
  const [loaded] = useFonts({ Lobster_400Regular });

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, borderBottomColor: showBorder ? colors.border : 'transparent' }]}>
      <Text style={[styles.brand, { color: colors.primary }, loaded ? { fontFamily: 'Lobster_400Regular' } : null]}>foodtinder</Text>
      <View style={styles.right}>
        <Pressable onPress={onPressNotifications} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>
        <Pressable onPress={onPressSettings} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 1 },
  brand: { fontSize: 28 },
  right: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, borderRadius: 999, marginLeft: 16 },
});
