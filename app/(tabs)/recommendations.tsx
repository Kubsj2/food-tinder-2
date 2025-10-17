import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import AppTopBar from '@/components/AppTopBar';

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRecommendedDishes();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <AppTopBar />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <AppTopBar />
        <Text style={{ color: colors.text }}>Brak rekomendacji</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.list, { backgroundColor: colors.bg }]}
      ListHeaderComponent={<AppTopBar />}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Image source={{ uri: item.image_url_full }} style={styles.image} />
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
            <Text style={{ color: colors.textMuted }}>{item?.flavour?.name}</Text>
            <Text style={{ color: colors.textMuted }}>{item?.cuisine?.name}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  card: { borderRadius: 14, overflow: 'hidden', marginBottom: 16, elevation: 3 },
  image: { width: '100%', height: 200 },
  content: { padding: 12 },
  title: { fontSize: 18, fontWeight: '700' },
});
