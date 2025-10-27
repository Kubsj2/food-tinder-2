import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

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

function buildShareLink(items: any[]) {
  // Generujemy prosty link z listą ID (backend może to później obsłużyć).
  const ids = items.map((it) => it?.id).filter((x: any) => Number.isFinite(x));
  const base =
    (process.env.EXPO_PUBLIC_WEB_ORIGIN as string) ||
    (process.env.EXPO_PUBLIC_API_BASE_URL as string) ||
    'http://localhost:8000';
  const origin = String(base).replace(/\/$/, '');
  return `${origin}/share/recommendations?ids=${ids.join(',')}`;
}

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Zwraca już znormalizowane obrazki (image_url_full) wg lib/api
        const data = await api.getRecommendedDishes(10, 1);
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareDisabled = useMemo(() => !items.length, [items]);

  const handleShare = async () => {
    const link = buildShareLink(items);
    try {
      await Share.share({
        title: 'Moje rekomendacje z FoodTinder',
        message: `Sprawdź moje rekomendacje: ${link}`,
        url: link,
      });
    } catch (e) {
      // Fallback — pokaż link w alertcie, by można było skopiować ręcznie
      Alert.alert('Udostępnianie', link);
    }
  };

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
        <View style={[styles.shareRow, { borderColor: colors.border }]}>
          <Pressable
            onPress={handleShare}
            disabled
            style={[
              styles.shareBtn,
              { backgroundColor: colors.bgMuted, borderColor: colors.border, opacity: 0.6 },
            ]}
          >
            <Ionicons name="share-outline" size={16} color={colors.text} />
            <Text style={[styles.shareTxt, { color: colors.text }]}>Udostępnij</Text>
          </Pressable>
        </View>
        <Text style={{ color: colors.text }}>Brak rekomendacji</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.list, { backgroundColor: colors.bg }]}
      ListHeaderComponent={
        <View>
          <View style={[styles.shareRow, { borderColor: colors.border }]}>
            <Pressable
              onPress={handleShare}
              disabled={shareDisabled}
              style={[
                styles.shareBtn,
                { backgroundColor: colors.bgMuted, borderColor: colors.border },
                shareDisabled && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="share-outline" size={16} color={colors.text} />
              <Text style={[styles.shareTxt, { color: colors.text }]}>Udostępnij</Text>
            </Pressable>
          </View>
        </View>
      }
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
                score:{' '}
                {Number.isFinite(item.match_score)
                  ? item.match_score.toFixed(2)
                  : String(item.match_score)}
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

  shareRow: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  shareTxt: { fontWeight: '800', fontSize: 13 },
});
