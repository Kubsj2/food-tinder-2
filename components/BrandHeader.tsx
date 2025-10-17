import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useFonts, Lobster_400Regular } from '@expo-google-fonts/lobster';
import { useTheme } from '@/lib/theme';
export default function BrandHeader() {
    const { colors } = useTheme();
  const [loaded] = useFonts({ Lobster_400Regular });
  return (
    
    <View style={styles.wrap}>
      <Text style={[styles.title, {color: colors.primary },  loaded ? { fontFamily: 'Lobster_400Regular' } : null]}>foodtinder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', paddingTop: 40, paddingBottom: 10 },
  title: { fontSize: 42 },
});
