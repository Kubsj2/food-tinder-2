import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import DishCard from "../../components/DishCard";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const BACKGROUND_COLOR = "#0E0E0E";

export default function ScrollScreen() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const nextOpacity = useSharedValue(0);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Brak tokenu — zaloguj się ponownie.");

      const response = await fetch("http://127.0.0.1:8000/api/swipe-cards", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Błąd API ${response.status}: ${text}`);
      }

      const data = await response.json();
      setDishes((prev) => [...prev, ...data]);
    } catch (error) {
      console.error("❌ Błąd pobierania kart:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendDecision = async (dishId: number, decision: "like" | "dislike") => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Brak tokenu.");

      await fetch("http://127.0.0.1:8000/api/swipe-decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dish_id: dishId, decision }),
      });
    } catch (error) {
      console.error("❌ Błąd wysyłania decyzji:", error);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, []);

  const handleSwipe = (direction: "left" | "right") => {
    const current = dishes[currentIndex];
    if (!current) return;

    runOnJS(sendDecision)(current.id, direction === "right" ? "like" : "dislike");

    const targetX =
      direction === "right" ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
    translateX.value = withTiming(targetX, { duration: 250 });
    rotate.value = withTiming(direction === "right" ? 15 : -15, { duration: 250 });

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
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
        nextOpacity.value = withSpring(0);
      }
    });

  const nextCardStyle = useAnimatedStyle(() => ({
    opacity: nextOpacity.value,
  }));

  const swipeOpacity = useDerivedValue(() =>
    interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [0, 1], "clamp")
  );

  // lewy gradient
  const leftGradientStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? swipeOpacity.value : 0,
  }));

  // prawy gradient
  const rightGradientStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? swipeOpacity.value : 0,
  }));

  const likeTextStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? swipeOpacity.value : 0,
    transform: [{ rotate: "-15deg" }],
  }));

  const dislikeTextStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? swipeOpacity.value : 0,
    transform: [{ rotate: "15deg" }],
  }));

  if (loading && dishes.length === 0) {
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
        <Text style={styles.endText}>Koniec kart 🎉</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Text style={styles.header}>FOOD TINDER</Text>

      <GestureDetector gesture={pan}>
        <View style={styles.cardWrapper}>
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

          {/* Gradient po lewej stronie */}
          <Animated.View
            pointerEvents="none"
            style={[styles.leftGradientContainer, leftGradientStyle]}
          >
            <LinearGradient
              colors={["rgba(191,6,3,0.8)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Gradient po prawej stronie */}
          <Animated.View
            pointerEvents="none"
            style={[styles.rightGradientContainer, rightGradientStyle]}
          >
            <LinearGradient
              colors={["transparent", "rgba(3,86,191,0.8)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          <Animated.Text style={[styles.likeText, likeTextStyle]}>
            LIKE
          </Animated.Text>
          <Animated.Text style={[styles.dislikeText, dislikeTextStyle]}>
            DISLIKE
          </Animated.Text>

          <DishCard dish={currentDish} translateX={translateX} rotate={rotate} />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    color: "#BF0603",
    marginTop: 60,
    marginBottom: 10,
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  endContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
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
  leftGradientContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH / 2,
  },
  rightGradientContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: SCREEN_WIDTH / 2,
  },
  likeText: {
    position: "absolute",
    top: 100,
    left: 30,
    fontSize: 36,
    fontWeight: "900",
    color: "#0386FF",
    opacity: 0,
  },
  dislikeText: {
    position: "absolute",
    top: 100,
    right: 30,
    fontSize: 36,
    fontWeight: "900",
    color: "#BF0603",
    opacity: 0,
  },
});
