import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import AppTopBar from '@/components/AppTopBar';

function paramNames(item: any, types: Array<'flavour' | 'cuisine' | 'category'>) {
  const names: string[] = [];
  types.forEach((t) => {
    const p = item?.parameters?.find?.((x: any) => x?.type === t);
    if (p?.name) names.push(p.name);
  });
  return names.join(' • ');
}

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRecommendedDishes(); // znormalizowane image_url_full wg nowego API
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
            {!!item.parameters?.length && (
              <Text style={{ color: colors.textMuted }}>
                {paramNames(item, ['flavour', 'cuisine', 'category'])}
              </Text>
            )}
            {typeof item.match_score === 'number' && (
              <Text style={{ color: colors.textMuted }}>
                score: {Number.isFinite(item.match_score) ? item.match_score.toFixed(2) : String(item.match_score)}
              </Text>
            )}
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
