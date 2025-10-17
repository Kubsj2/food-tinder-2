import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import DishCard from '@/components/DishCard';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import AppTopBar from '@/components/AppTopBar';
import ActionBar from '@/components/ActionBar';
import Chip from '@/components/Chip';
import DishDetailsModal from '@/components/DishDetailsModal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function ScrollScreen() {
  const { colors } = useTheme();
  const [dishes, setDishes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const nextOpacity = useSharedValue(0);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const data = await api.getSwipeCards();
      setDishes((prev) => [...prev, ...data]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendDecision = async (dishId: number, decision: 'like' | 'dislike') => {
    try {
      await api.postSwipeDecision({ dish_id: dishId, decision });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, []);

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
      nextOpacity.value = withTiming(1, { duration: 250 });
      if (currentIndex >= dishes.length - 2) {
        runOnJS(fetchDishes)();
      }
    }, 260);
  };

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

  if (loading && dishes.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <AppTopBar />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentDish = dishes[currentIndex];
  const nextDish = dishes[currentIndex + 1];
  const total = dishes.length;
  const position = Math.min(currentIndex + 1, total);

  if (!currentDish) {
    return (
      <View style={[styles.endContainer, { backgroundColor: colors.bg }]}>
        <AppTopBar />
        <Text style={[styles.endText, { color: colors.primary }]}>Koniec kart</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.bg }]}>
      <AppTopBar />
      <View style={styles.topMeta}>
        <Text style={[styles.counter, { color: colors.text }]}>{position}/{total}</Text>
      </View>

      <Animated.View style={[styles.leftGradient, leftGradientStyle]}>
        <LinearGradient colors={['rgba(191,6,3,0.9)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      <Animated.View style={[styles.rightGradient, rightGradientStyle]}>
        <LinearGradient colors={['transparent', 'rgba(3,86,191,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      <GestureDetector gesture={pan}>
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
        {!!currentDish?.flavour?.name && <Chip label={currentDish.flavour.name} />}
        {!!currentDish?.cuisine?.name && <Chip label={currentDish.cuisine.name} />}
        {!!currentDish?.difficulty && <Chip label={String(currentDish.difficulty)} />}
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

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  endContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  endText: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  topMeta: { width: '100%', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 8 },
  counter: { fontSize: 14, fontWeight: '600' },
  cardWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  leftGradient: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SCREEN_WIDTH / 2 },
  rightGradient: { position: 'absolute', top: 0, bottom: 0, right: 0, width: SCREEN_WIDTH / 2 },
  likeText: { position: 'absolute', top: 100, left: 30, fontSize: 36, fontWeight: '900', color: '#0386FF', opacity: 0 },
  dislikeText: { position: 'absolute', top: 100, right: 30, fontSize: 36, fontWeight: '900', color: '#BF0603', opacity: 0 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, width: '100%' },
});
