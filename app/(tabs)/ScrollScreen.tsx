import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Dimensions } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import localData from "../../assets/dishes.json";
import DishCard from "../../components/DishCard";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function ScrollScreen() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, "like" | "dislike">>({});

  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const nextOpacity = useSharedValue(0);

  useEffect(() => {
    setDishes(localData);
  }, []);

  const handleSwipe = (direction: "left" | "right") => {
    const current = dishes[currentIndex];
    if (!current) return;

    setLiked((prev) => ({
      ...prev,
      [current.id]: direction === "right" ? "like" : "dislike",
    }));

    // 🔹 karta odlatuje poza ekran, znikając płynnie
    const targetX = direction === "right" ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
    translateX.value = withTiming(targetX, { duration: 250 });
    rotate.value = withTiming(direction === "right" ? 15 : -15, { duration: 250 });

    // 🔸 przejście na nową kartę po lekkim opóźnieniu, żeby nie było cofki
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      translateX.value = 0;
      rotate.value = 0;
      nextOpacity.value = withTiming(1, { duration: 250 });
    }, 260); // po zakończeniu animacji odlotu
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotate.value = e.translationX / 20;

      // 🔹 podczas przesuwania zmieniamy opacity następnej karty (0 → 0.3)
      nextOpacity.value = interpolate(
        Math.abs(e.translationX),
        [0, SWIPE_THRESHOLD],
        [0, 0.3],
        "clamp"
      );
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) runOnJS(handleSwipe)("right");
      else if (e.translationX < -SWIPE_THRESHOLD) runOnJS(handleSwipe)("left");
      else {
        // 🔹 cofnięcie, jeśli użytkownik nie przesunął wystarczająco daleko
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
        nextOpacity.value = withSpring(0);
      }
    });

  const nextCardStyle = useAnimatedStyle(() => ({
    opacity: nextOpacity.value,
  }));

  if (dishes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BF0603" />
      </View>
    );
  }

  const currentDish = dishes[currentIndex];
  const nextDish = dishes[currentIndex + 1];

  if (!currentDish) {
    return (
      <View style={styles.endContainer}>
        <Text style={styles.endText}>Koniec potraw 🎉</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={pan}>
        <View style={styles.cardWrapper}>
          {/* 🔹 następna karta za aktualną */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.cardWrapper,
              nextCardStyle,
              !nextDish && { opacity: 0 },
            ]}
          >
            {nextDish && (
              <DishCard
                dish={nextDish}
                translateX={{ value: 0 }}
                rotate={{ value: 0 }}
              />
            )}
          </Animated.View>

          {/* 🔹 aktualna karta */}
          <DishCard
            dish={currentDish}
            translateX={translateX}
            rotate={rotate}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0E0E0E",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0E0E0E",
    alignItems: "center",
    justifyContent: "center",
  },
  endContainer: {
    flex: 1,
    backgroundColor: "#0E0E0E",
    alignItems: "center",
    justifyContent: "center",
  },
  endText: {
    color: "#BF0603",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
