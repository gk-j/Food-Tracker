import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function HealthScoreBar({ score }: { score: number }) {
  const pct = score / 10;
  const color = score >= 7 ? Colors.dark.success : score >= 4 ? Colors.dark.carbs : Colors.dark.danger;
  return (
    <View style={styles.healthScoreRow}>
      <View style={styles.healthScoreBar}>
        <View style={[styles.healthScoreFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.healthScoreLabel, { color }]}>{score}/10</Text>
    </View>
  );
}

export default function MealResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ analysis: string; imageUri: string }>();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const analysis = params.analysis ? JSON.parse(params.analysis) : null;
  const imageUri = params.imageUri ?? null;

  if (!analysis) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.dark.text }}>No analysis data</Text>
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSave = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const now = new Date();
      const res = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formatDate(now),
          time: formatTime(now),
          imageUrl: imageUri,
          foodItems: analysis.foodItems,
          totalCalories: analysis.totalCalories,
          totalProtein: analysis.totalProtein,
          totalCarbs: analysis.totalCarbs,
          totalFats: analysis.totalFats,
          healthScore: analysis.healthScore,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      queryClient.invalidateQueries({ queryKey: ["daily"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.dismiss();
    } catch {
      setIsSaving(false);
      Alert.alert("Error", "Failed to save meal. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={22} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {imageUri && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Image
              source={{ uri: imageUri }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </Animated.View>
        )}

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <View style={styles.descCard}>
            <Text style={styles.descTitle}>{analysis.description ?? "Analyzed meal"}</Text>
            <View style={styles.totalCalRow}>
              <Feather name="zap" size={16} color={Colors.dark.accent} />
              <Text style={styles.totalCalText}>{Math.round(analysis.totalCalories)} kcal total</Text>
            </View>
          </View>
        </Animated.View>

        {/* Macro Summary */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <View style={styles.macroSummary}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: Colors.dark.protein }]}>
                {Math.round(analysis.totalProtein)}g
              </Text>
              <Text style={styles.macroItemLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: Colors.dark.carbs }]}>
                {Math.round(analysis.totalCarbs)}g
              </Text>
              <Text style={styles.macroItemLabel}>Carbs</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: Colors.dark.fats }]}>
                {Math.round(analysis.totalFats)}g
              </Text>
              <Text style={styles.macroItemLabel}>Fats</Text>
            </View>
          </View>
        </Animated.View>

        {/* Health Score */}
        {analysis.healthScore != null && (
          <Animated.View entering={FadeInDown.delay(220).duration(400)}>
            <View style={styles.healthCard}>
              <View style={styles.healthScoreHeader}>
                <Feather name="heart" size={16} color={Colors.dark.protein} />
                <Text style={styles.healthScoreTitle}>Health Score</Text>
              </View>
              <HealthScoreBar score={analysis.healthScore} />
            </View>
          </Animated.View>
        )}

        {/* Food Items */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Foods</Text>
            {(analysis.foodItems ?? []).map((item: any, i: number) => (
              <View key={i} style={styles.foodItem}>
                <View style={styles.foodItemLeft}>
                  <Text style={styles.foodItemName}>{item.name}</Text>
                  {item.portion && (
                    <Text style={styles.foodItemPortion}>{item.portion}</Text>
                  )}
                </View>
                <View style={styles.foodItemRight}>
                  <Text style={styles.foodItemCal}>{Math.round(item.calories)} kcal</Text>
                  <View style={styles.foodItemMacros}>
                    <Text style={[styles.foodItemMacro, { color: Colors.dark.protein }]}>
                      P {Math.round(item.protein)}g
                    </Text>
                    <Text style={[styles.foodItemMacro, { color: Colors.dark.carbs }]}>
                      C {Math.round(item.carbs)}g
                    </Text>
                    <Text style={[styles.foodItemMacro, { color: Colors.dark.fats }]}>
                      F {Math.round(item.fats)}g
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
        ]}
      >
        <Pressable style={styles.discardButton} onPress={() => router.back()}>
          <Text style={styles.discardText}>Discard</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveText}>{isSaving ? "Saving..." : "Log Meal"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 8,
  },
  foodImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
  },
  descCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    gap: 8,
  },
  descTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  totalCalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalCalText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.accent,
  },
  macroSummary: {
    flexDirection: "row",
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  macroValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  macroItemLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  macroDivider: {
    width: 1,
    backgroundColor: Colors.dark.separator,
  },
  healthCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    gap: 12,
  },
  healthScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthScoreTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.dark.text,
  },
  healthScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  healthScoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.dark.backgroundTertiary,
    borderRadius: 4,
    overflow: "hidden",
  },
  healthScoreFill: {
    height: "100%",
    borderRadius: 4,
  },
  healthScoreLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    minWidth: 36,
    textAlign: "right",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
  },
  foodItem: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  foodItemLeft: { flex: 1, gap: 3 },
  foodItemName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  foodItemPortion: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  foodItemRight: { alignItems: "flex-end", gap: 4 },
  foodItemCal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.accent,
  },
  foodItemMacros: {
    flexDirection: "row",
    gap: 6,
  },
  foodItemMacro: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.separator,
  },
  discardButton: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingVertical: 16,
    alignItems: "center",
  },
  discardText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
