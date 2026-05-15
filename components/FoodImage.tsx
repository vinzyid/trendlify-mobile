import { useState } from "react";
import { Image, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { getFoodImageUrl } from "@/utils/foodImage";

type Cat = "Minuman" | "Tradisional" | "Modern" | "Lainnya";

const CAT_STYLE: Record<Cat, { icon: string; iconColor: string; iconBg: string }> = {
  Minuman:     { icon: "cafe-outline",       iconColor: "#3B82F6", iconBg: "#EFF6FF" },
  Tradisional: { icon: "restaurant-outline", iconColor: Colors.emerald, iconBg: "#F0FDF4" },
  Modern:      { icon: "sparkles-outline",   iconColor: Colors.orange,  iconBg: Colors.orangeBg },
  Lainnya:     { icon: "nutrition-outline",  iconColor: Colors.stone500, iconBg: Colors.stone100 },
};

type Props = {
  keyword: string;
  category: Cat;
  size: number;
  borderRadius?: number;
};

export default function FoodImage({ keyword, category, size, borderRadius = 14 }: Props) {
  const [failed, setFailed] = useState(false);
  const cs = CAT_STYLE[category];

  if (failed) {
    return (
      <View style={[styles.fallback, {
        width: size, height: size, borderRadius,
        backgroundColor: cs.iconBg,
      }]}>
        <Ionicons name={cs.icon as any} size={size * 0.42} color={cs.iconColor} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: getFoodImageUrl(keyword), cache: "reload" }}
      style={{ width: size, height: size, borderRadius }}
      onError={() => setFailed(true)}
      defaultSource={require("@/assets/icon.png")}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
});
