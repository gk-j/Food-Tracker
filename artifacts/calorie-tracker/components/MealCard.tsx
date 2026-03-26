import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import Colors from "@/constants/colors";

type FoodItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Meal = {
  id: number;
  time: string;
  imageUrl?: string | null;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  healthScore?: number | null;
};

type Props = {
  meal: Meal;
  onDelete?: () => void;
};

export function MealCard({ meal, onDelete }: Props) {
  const firstFoodName = meal.foodItems[0]?.name ?? "Unknown";
  const mealTitle =
    meal.foodItems.length > 1
      ? `${firstFoodName} + ${meal.foodItems.length - 1} more`
      : firstFoodName;

  const renderRightActions = () => (
    <Pressable style={styles.deleteAction} onPress={onDelete}>
      <Feather name="trash-2" size={20} color="#fff" />
    </Pressable>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <View style={styles.card}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="camera" size={20} color={Colors.dark.textMuted} />
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {mealTitle}
            </Text>
            <Text style={styles.time}>{meal.time}</Text>
          </View>
          <View style={styles.calorieRow}>
            <Feather name="zap" size={12} color={Colors.dark.accent} />
            <Text style={styles.calorieText}>
              {Math.round(meal.totalCalories)} kcal
            </Text>
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macroBadge}>
              <Text style={[styles.macroLabel, { color: Colors.dark.protein }]}>
                {Math.round(meal.totalProtein)}g P
              </Text>
            </View>
            <View style={styles.macroBadge}>
              <Text style={[styles.macroLabel, { color: Colors.dark.carbs }]}>
                {Math.round(meal.totalCarbs)}g C
              </Text>
            </View>
            <View style={styles.macroBadge}>
              <Text style={[styles.macroLabel, { color: Colors.dark.fats }]}>
                {Math.round(meal.totalFats)}g F
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: Colors.dark.backgroundTertiary,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: Colors.dark.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  calorieText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  macroRow: {
    flexDirection: "row",
    gap: 6,
  },
  macroBadge: {
    backgroundColor: Colors.dark.backgroundTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  macroLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  deleteAction: {
    backgroundColor: Colors.dark.danger,
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginLeft: 8,
  },
});
