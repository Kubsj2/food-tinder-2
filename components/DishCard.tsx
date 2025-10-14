import { View, Text, Image, Dimensions, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DishCardProps {
  dish: any;
  translateX: SharedValue<number>;
  rotate: SharedValue<number>;
}

export default function DishCard({ dish, translateX, rotate }: DishCardProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));
  console.log(dish);
  return (
    <Animated.View style={[animatedStyle, styles.card]}>
      <Image
        source={{ uri: dish.image_url_full }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title}>{dish.name}</Text>
        <Text style={styles.subtitle}>{dish.flavour.name}</Text>
        <Text style={styles.category}>{dish.cuisine.name}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 320,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#BF0603', // primary color
  },
  subtitle: {
    color: '#374151',
    fontSize: 18,
    marginTop: 10
  }

})