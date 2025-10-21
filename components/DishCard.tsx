import { View, Text, Image, Dimensions, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DishCardProps {
  dish: any;
  translateX: SharedValue<number>;
  rotate: SharedValue<number>;
}

type ParamType = 'category' | 'cuisine' | 'flavour';

function getParamName(dish: any, type: ParamType) {
  return dish?.parameters?.find?.((p: any) => p?.type === type)?.name;
}

export default function DishCard({ dish, translateX, rotate }: DishCardProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const imageUri = dish?.image_url_full || dish?.image_url || undefined;

  // Nowe API: flavour/cuisine z `parameters[]`; fallback do starych pól, jeśli jeszcze gdzieś przyjdą
  const flavour = getParamName(dish, 'flavour') ?? dish?.flavour?.name;
  const cuisine = getParamName(dish, 'cuisine') ?? dish?.cuisine?.name;

  return (
    <Animated.View style={[animatedStyle, styles.card]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{dish?.name || 'Bez nazwy'}</Text>
        {!!flavour && <Text style={styles.subtitle}>{flavour}</Text>}
        {!!cuisine && <Text style={styles.category}>{cuisine}</Text>}
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
  imagePlaceholder: {
    backgroundColor: '#E5E7EB',
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
    marginTop: 10,
  },
  category: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 4,
  },
});
