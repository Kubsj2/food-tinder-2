import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import DishCard from '@/components/DishCard';
import ActionBar from '@/components/ActionBar';
import Chip from '@/components/Chip';
import DishDetailsModal from '@/components/DishDetailsModal';
import PlaceholderCard from '@/components/PlaceholderCard';

import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type Mode = 'select' | 'swipe';
type FilterItem = { id: number | null; name: string; link?: string };

function getParamName(dish: any, type: 'category' | 'cuisine' | 'flavour') {
  return dish?.parameters?.find?.((p: any) => p?.type === type)?.name;
}
function isUnauthorized(err: any) {
  return typeof err?.message === 'string' && /API\s*401/.test(err.message);
}

/** wydobywa ID parametru z linku (ostatnia liczba w URL) */
function extractIdFromLink(url: string): number | null {
  const m = String(url).match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : null;
}

export default function IndexScreen() {
  const { colors } = useTheme();
  const { logout } = useAuth();

  const [mode, setMode] = useState<Mode>('select');

  // filtry (kafelki)
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // wybrany filtr (zawiera ID i link)
  const [selectedFilter, setSelectedFilter] = useState<FilterItem | null>(null);

  // talia do swipów
  const [dishes, setDishes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [initialDishesLoaded, setInitialDishesLoaded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState<null | 'network' | 'server'>(null);

  // animacje kart
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  // === FILTRY (KAFELKI) ===
  useEffect(() => {
    (async () => {
      try {
        setFiltersLoading(true);
        const base: FilterItem[] = [{ id: null, name: 'Wszystko' }];

        // popularne parametry -> linki
        const links = await api.getPopularParameterLinks(8);

        // mapujemy link -> id
        const linkPairs = links
          .map((link) => {
            const id = extractIdFromLink(link);
            return id ? { id, link } : null;
          })
          .filter((x): x is { id: number; link: string } => !!x);

        const uniqueById = Array.from(new Map(linkPairs.map(p => [p.id, p])).values()).slice(0, 7);

        // dociągamy nazwy parametrów
        const details = await Promise.all(
          uniqueById.map(async (p) => {
            try {
              const param = await api.getParameter(p.id);
              return { id: p.id, name: param.name, link: p.link } as FilterItem;
            } catch {
              return null;
            }
          })
        );

        const cleaned = details.filter((x): x is FilterItem => !!x);
        setFilters([...base, ...cleaned]);
      } catch (e) {
        console.warn('Nie udało się pobrać filtrów', e);
        setFilters([{ id: null, name: 'Wszystko' }]);
      } finally {
        setFiltersLoading(false);
      }
    })();
  }, []);

  // === SWIPY ===
  const fetchDishes = async (filter: FilterItem | null) => {
    try {
      setDishesLoading(true);
      setError(null);

      let data;
      if (!filter || filter.id === null) {
        // Wszystko
        data = await api.getSwipeCards();
      } else if (filter.link) {
        // preferuj pełny link z backendu (swipe-cards-by-parameter/{id})
        data = await api.getSwipeCardsByParameterLink(filter.link);
      } else {
        // fallback (gdyby linka nie było, a backend wspiera /api/swipe-cards/{id})
        data = await api.getSwipeCardsByParameter(filter.id);
      }

      setDishes((prev) => [...prev, ...data]);
    } catch (e: any) {
      console.error(e);
      if (isUnauthorized(e)) {
        await logout();
        return;
      }
      setError('network');
    } finally {
      setDishesLoading(false);
      setInitialDishesLoaded(true);
    }
  };

  const enterSwipeWithFilter = async (filter: FilterItem) => {
    setSelectedFilter(filter);
    setMode('swipe');
    setDishes([]);
    setCurrentIndex(0);
    setInitialDishesLoaded(false);
    await fetchDishes(filter);
  };

  const backToGrid = () => {
    setMode('select');
    setDetailsOpen(false);
    setDishes([]);
    setCurrentIndex(0);
    setError(null);
    setSelectedFilter(null);
  };

  const handleRefresh = async () => {
    setDishes([]);
    setCurrentIndex(0);
    setError(null);
    await fetchDishes(selectedFilter);
  };

  const sendDecision = async (dishId: number, decision: 'like' | 'dislike') => {
    try {
      await api.postSwipeDecision({ dish_id: dishId, decision });
    } catch (e: any) {
      console.error(e);
      if (isUnauthorized(e)) {
        await logout();
      }
    }
  };

  // handleSwipe musi być przed 'pan'
  const handleSwipe = (direction: 'left' | 'right') => {
    const current = dishes[currentIndex];
    if (!current) return;

    runOnJS(sendDecision)(current.id, direction === 'right' ? 'like' : 'dislike');

    const targetX = direction === 'right' ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
    translateX.value = withTiming(targetX, { duration: 250 });
    rotate.value = withTiming(direction === 'right' ? 15 : -15, { duration: 250 });

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      translateX.value = 0;
      rotate.value = 0;

      // doładowanie kolejnych kart gdy kończą się lokalnie
      if (currentIndex >= dishes.length - 2) {
        runOnJS(fetchDishes)(selectedFilter);
      }
    }, 260);
  };

  // gest
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotate.value = e.translationX / 20;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) runOnJS(handleSwipe)('right');
      else if (e.translationX < -SWIPE_THRESHOLD) runOnJS(handleSwipe)('left');
      else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const swipeOpacity = useDerivedValue(() =>
    interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [0, 1], 'clamp')
  );

  const leftGradientStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? swipeOpacity.value : 0,
  }));
  const rightGradientStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? swipeOpacity.value : 0,
  }));
  const likeTextStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? swipeOpacity.value : 0,
    transform: [{ rotate: '-15deg' }],
  }));
  const dislikeTextStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? swipeOpacity.value : 0,
    transform: [{ rotate: '15deg' }],
  }));

  /* ======== RENDER ======== */

  // tryb wyboru (GRID)
  if (mode === 'select') {
    return (
      <View style={[styles.selectRoot, { backgroundColor: colors.bg }]}>
        <Text style={[styles.selectTitle, { color: colors.text }]}>Wybierz kategorię</Text>

        {filtersLoading ? (
          <View style={styles.selectCenter}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filters}
            keyExtractor={(item) => `${item.id ?? 'all'}-${item.name}`}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={[styles.gridList, { paddingBottom: 24 }]}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.tile,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => enterSwipeWithFilter(item)}
              >
                <Text style={[styles.tileText, { color: colors.text }]}>{item.name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.selectCenter}>
                <PlaceholderCard title="Brak filtrów" subtitle="Spróbuj odświeżyć aplikację." />
              </View>
            }
          />
        )}
      </View>
    );
  }

  // tryb swipe
  const currentDish = dishes[currentIndex];
  const nextDish = dishes[currentIndex + 1];

  if (dishesLoading && !initialDishesLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <BackRow colors={colors} onBack={backToGrid} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.endContainer, { backgroundColor: colors.bg }]}>
        <BackRow colors={colors} onBack={backToGrid} />
        <PlaceholderCard
          title={error === 'network' ? 'Nie udało się pobrać kart' : 'Błąd serwera'}
          subtitle={error === 'network' ? 'Sprawdź połączenie i spróbuj ponownie.' : 'Spróbuj ponownie za chwilę.'}
          onRefresh={handleRefresh}
        />
      </View>
    );
  }

  if (!dishes.length) {
    return (
      <View style={[styles.endContainer, { backgroundColor: colors.bg }]}>
        <BackRow colors={colors} onBack={backToGrid} />
        <PlaceholderCard
          title="Brak kart do wyświetlenia"
          subtitle="Wybierz inny filtr lub odśwież."
          onRefresh={handleRefresh}
        />
      </View>
    );
  }

  if (!currentDish) {
    return (
      <View style={[styles.endContainer, { backgroundColor: colors.bg }]}>
        <BackRow colors={colors} onBack={backToGrid} />
        <PlaceholderCard
          title="To już wszystko na teraz"
          subtitle="Możesz odświeżyć lub wrócić do wyboru kategorii."
          onRefresh={handleRefresh}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.bg }]}>
      <BackRow colors={colors} onBack={backToGrid} />

      <Animated.View style={[styles.leftGradient, leftGradientStyle]}>
        <LinearGradient
          colors={['rgba(191,6,3,0.9)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View style={[styles.rightGradient, rightGradientStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(3,86,191,0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <GestureDetector gesture={Gesture.Pan()
        .onUpdate((e) => {
          translateX.value = e.translationX;
          rotate.value = e.translationX / 20;
        })
        .onEnd((e) => {
          if (e.translationX > SWIPE_THRESHOLD) runOnJS(handleSwipe)('right');
          else if (e.translationX < -SWIPE_THRESHOLD) runOnJS(handleSwipe)('left');
          else {
            translateX.value = withSpring(0);
            rotate.value = withSpring(0);
          }
        })
      }>
        <View style={styles.cardWrapper}>
          {nextDish && (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { justifyContent: 'center', alignItems: 'center', zIndex: 0, opacity: 0.3 },
              ]}
            >
              <DishCard dish={nextDish} translateX={{ value: 0 }} rotate={{ value: 0 }} />
            </Animated.View>
          )}

          <Animated.Text style={[styles.likeText, likeTextStyle]}>LIKE</Animated.Text>
          <Animated.Text style={[styles.dislikeText, dislikeTextStyle]}>DISLIKE</Animated.Text>

          <DishCard dish={currentDish} translateX={translateX} rotate={rotate} />
        </View>
      </GestureDetector>

      <View style={styles.chipsRow}>
        {!!getParamName(currentDish, 'flavour') && <Chip label={getParamName(currentDish, 'flavour')} />}
        {!!getParamName(currentDish, 'cuisine') && <Chip label={getParamName(currentDish, 'cuisine')} />}
        {!!getParamName(currentDish, 'category') && <Chip label={getParamName(currentDish, 'category')} />}
      </View>

      <ActionBar
        onDislike={() => handleSwipe('left')}
        onInfo={() => setDetailsOpen(true)}
        onLike={() => handleSwipe('right')}
        disabled={!currentDish}
      />

      <DishDetailsModal visible={detailsOpen} onClose={() => setDetailsOpen(false)} dish={currentDish} />
    </GestureHandlerRootView>
  );
}

function BackRow({ colors, onBack }: { colors: any; onBack: () => void }) {
  return (
    <View style={styles.backRow}>
      <Pressable
        onPress={onBack}
        style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.bgMuted }]}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
        <Text style={[styles.backTxt, { color: colors.text }]}>Wróć</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // tryb wyboru
  selectRoot: { flex: 1 },
  selectTitle: { fontSize: 18, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10, marginBottom: 8 },
  selectCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridList: { paddingHorizontal: 16, paddingTop: 8, rowGap: 12 },
  tile: {
    flex: 1,
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tileText: { fontSize: 16, fontWeight: '800', textAlign: 'center' },

  // back
  backRow: { width: '100%', paddingHorizontal: 12, paddingTop: 8, alignItems: 'flex-start' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  backTxt: { fontWeight: '800' },

  // swipe
  root: { flex: 1, alignItems: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  endContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  leftGradient: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SCREEN_WIDTH / 2 },
  rightGradient: { position: 'absolute', top: 0, bottom: 0, right: 0, width: SCREEN_WIDTH / 2 },
  likeText: { position: 'absolute', top: 100, left: 30, fontSize: 36, fontWeight: '900', color: '#0386FF', opacity: 0 },
  dislikeText: { position: 'absolute', top: 100, right: 30, fontSize: 36, fontWeight: '900', color: '#BF0603', opacity: 0 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, width: '100%' },
  cardWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
