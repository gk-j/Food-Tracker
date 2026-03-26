import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { CircularProgress } from "@/components/CircularProgress";
import { MacroCard } from "@/components/MacroCard";
import { MealCard } from "@/components/MealCard";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (formatDate(date) === formatDate(today)) return "Today";
  if (formatDate(date) === formatDate(yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  const dateStr = formatDate(selectedDate);

  const { data: daily, isLoading, refetch } = useQuery({
    queryKey: ["daily", dateStr],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/analytics/daily?date=${dateStr}`);
      if (!res.ok) throw new Error("Failed to fetch daily summary");
      return res.json();
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/meals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete meal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily", dateStr] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    Haptics.selectionAsync();
  };

  const goToNextDay = () => {
    const today = new Date();
    if (formatDate(selectedDate) === formatDate(today)) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    Haptics.selectionAsync();
  };

  const totalCalories = daily?.totalCalories ?? 0;
  const calorieGoal = daily?.calorieGoal ?? 2000;
  const caloriesLeft = Math.max(calorieGoal - totalCalories, 0);
  const caloriePct = Math.min(totalCalories / calorieGoal, 1);

  const isToday = formatDate(selectedDate) === formatDate(new Date());
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: 120 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.dark.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.appTitle}>
            <Text style={styles.appName}>NutriSnap</Text>
          </View>
          <View style={styles.streakBadge}>
            <Feather name="zap" size={14} color={Colors.dark.accent} />
            <Text style={styles.streakText}>Track</Text>
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <Pressable onPress={goToPrevDay} style={styles.dateArrow}>
            <Feather name="chevron-left" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
          <Text style={styles.dateLabel}>{formatDisplayDate(selectedDate)}</Text>
          <Pressable
            onPress={goToNextDay}
            style={[styles.dateArrow, isToday && styles.dateArrowDisabled]}
          >
            <Feather
              name="chevron-right"
              size={20}
              color={isToday ? Colors.dark.textMuted : Colors.dark.textSecondary}
            />
          </Pressable>
        </View>

        {/* Calorie Ring Card */}
        <View style={styles.calorieCard}>
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieNumber}>{Math.round(caloriesLeft)}</Text>
              <Text style={styles.calorieSubtext}>
                {totalCalories > calorieGoal ? "calories over" : "calories left"}
              </Text>
              <View style={styles.calorieBreakdown}>
                <View style={styles.calorieBreakdownItem}>
                  <Text style={styles.calorieBreakdownLabel}>Goal</Text>
                  <Text style={styles.calorieBreakdownValue}>{calorieGoal}</Text>
                </View>
                <View style={styles.calorieBreakdownSep} />
                <View style={styles.calorieBreakdownItem}>
                  <Text style={styles.calorieBreakdownLabel}>Eaten</Text>
                  <Text style={styles.calorieBreakdownValue}>{Math.round(totalCalories)}</Text>
                </View>
              </View>
            </View>
            <CircularProgress
              size={120}
              strokeWidth={10}
              progress={caloriePct}
              color={totalCalories > calorieGoal ? Colors.dark.danger : Colors.dark.accent}
              trackColor="rgba(255,255,255,0.06)"
            >
              <View style={styles.ringCenter}>
                <Feather
                  name="zap"
                  size={22}
                  color={totalCalories > calorieGoal ? Colors.dark.danger : Colors.dark.accent}
                />
              </View>
            </CircularProgress>
          </View>

        {/* Macro Cards */}
        <View style={styles.macroGrid}>
          <MacroCard
            label="Protein"
            value={daily?.totalProtein ?? 0}
            goal={daily?.proteinGoal ?? 150}
            color={Colors.dark.protein}
            glow={Colors.dark.proteinGlow}
            isOver={(daily?.totalProtein ?? 0) > (daily?.proteinGoal ?? 150)}
          />
          <MacroCard
            label="Carbs"
            value={daily?.totalCarbs ?? 0}
            goal={daily?.carbGoal ?? 250}
            color={Colors.dark.carbs}
            glow={Colors.dark.carbsGlow}
            isOver={(daily?.totalCarbs ?? 0) > (daily?.carbGoal ?? 250)}
          />
        </View>
        <View style={[styles.macroGrid, { marginTop: 10 }]}>
          <MacroCard
            label="Fats"
            value={daily?.totalFats ?? 0}
            goal={daily?.fatGoal ?? 65}
            color={Colors.dark.fats}
            glow={Colors.dark.fatsGlow}
            isOver={(daily?.totalFats ?? 0) > (daily?.fatGoal ?? 65)}
          />
          <View style={{ flex: 1, backgroundColor: Colors.dark.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.dark.text }}>
              {(daily?.meals ?? []).length}
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.dark.textSecondary, marginTop: 4 }}>
              meals today
            </Text>
          </View>
        </View>

        {/* Meals List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently uploaded</Text>
          {(daily?.meals ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="camera" size={36} color={Colors.dark.textMuted} />
              <Text style={styles.emptyTitle}>No meals yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to snap a photo of your meal
              </Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {(daily?.meals ?? []).map((meal: any) => (
                <View key={meal.id}>
                  <MealCard
                    meal={meal}
                    onDelete={() => deleteMealMutation.mutate(meal.id)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={[
          styles.fab,
          { bottom: (Platform.OS === "web" ? 84 + 34 : 84) + 16 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/scan");
        }}
      >
        <Feather name="plus" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.dark.text,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.dark.accentGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  streakText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.dark.accent,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  dateArrow: { padding: 4 },
  dateArrowDisabled: { opacity: 0.3 },
  dateLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.dark.text,
    minWidth: 100,
    textAlign: "center",
  },
  calorieCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calorieLeft: { flex: 1, gap: 4 },
  calorieNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    color: Colors.dark.text,
    lineHeight: 48,
  },
  calorieSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  calorieBreakdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  calorieBreakdownItem: { gap: 2 },
  calorieBreakdownLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  calorieBreakdownValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  calorieBreakdownSep: {
    width: 1,
    height: 24,
    backgroundColor: Colors.dark.separator,
  },
  ringCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  macroGrid: {
    flexDirection: "row",
    gap: 10,
  },
  section: { gap: 12 },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.dark.text,
  },
  mealsList: { gap: 10 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.dark.textSecondary,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
