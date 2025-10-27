import { useTheme } from "@/lib/theme";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  dish: any | null;
};

function getParamName(dish: any, type: 'category' | 'cuisine' | 'flavour') {
  return dish?.parameters?.find?.((p: any) => p?.type === type)?.name;
}

export default function DishDetailsModal({ visible, onClose, dish }: Props) {
  const { colors } = useTheme();
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (visible) {
      scrimOpacity.setValue(0);
      scale.setValue(0.98);
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    } else {
      scrimOpacity.setValue(0);
      scale.setValue(0.98);
    }
  }, [visible]);

  if (!dish) return null;

  const imageUri = dish?.image_url_full || dish?.image_url || undefined;

  const rows: [string, string | number | undefined][] = [
    ["Kuchnia", getParamName(dish, 'cuisine')],
    ["Smak", getParamName(dish, 'flavour')],
    ["Kategoria", getParamName(dish, 'category')],
    ["Kalorie", dish?.calories],
    ["Cena", dish?.price],
  ];

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlayRoot}>
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]} />
        <Animated.View style={[styles.contentWrap, { transform: [{ scale }] }]}>
          <View style={[styles.content, { backgroundColor: colors.bg }]}>
            <View
              style={[
                styles.imageWrap,
                { borderColor: colors.border, backgroundColor: colors.bg },
              ]}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <View style={[styles.image, { backgroundColor: colors.bgMuted }]} />
              )}
            </View>
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.title, { color: colors.text }]}>
                {dish?.name ?? 'Bez nazwy'}
              </Text>
              {!!dish?.description && (
                <Text style={[styles.desc, { color: colors.text }]}>
                  {dish.description}
                </Text>
              )}
              <View style={styles.meta}>
                {rows
                  .filter(([, v]) => v !== undefined && v !== null && v !== "")
                  .map(([k, v]) => (
                    <View key={k} style={styles.row}>
                      <Text style={[styles.key, { color: colors.textMuted }]}>
                        {k}
                      </Text>
                      <Text style={[styles.val, { color: colors.text }]}>
                        {String(v)}
                      </Text>
                    </View>
                  ))}
              </View>
              <Pressable
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: colors.bgMuted },
                  { borderColor: colors.border },
                ]}
              >
                <Text style={[styles.closeTxt, { color: colors.text }]}>
                  Zamknij
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  contentWrap: { width: "96%", height: "92%" },
  content: { borderRadius: 24, overflow: "hidden", flex: 1 },
  imageWrap: {
    margin: 16,
    padding: 8,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  image: { width: "100%", height: 320, borderRadius: 12 },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  desc: { fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 14 },
  meta: { gap: 8, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  key: { fontSize: 14 },
  val: { fontSize: 14, fontWeight: "700" },
  closeBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  closeTxt: { fontWeight: "800", fontSize: 16 },
});
