import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

const SCREEN_WIDTH = Dimensions.get("window").width;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

type View_ = "weekly" | "monthly";

type DayData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

function BarChart({
  data,
  goal,
  color,
}: {
  data: DayData[];
  goal: number;
  color: string;
}) {
  const maxVal = Math.max(goal, ...data.map((d) => d.calories), 1);
  const chartW = SCREEN_WIDTH - 32 - 32;
  const barW = Math.floor(chartW / data.length) - 4;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.chart}>
        {data.map((d, i) => {
          const height = (d.calories / maxVal) * 160;
          const goalH = (goal / maxVal) * 160;
          const isOver = d.calories > goal;
          return (
            <View key={i} style={chartStyles.barCol}>
              <View style={[chartStyles.barTrack, { height: 160 }]}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: Math.max(height, 2),
                      width: barW,
                      backgroundColor: d.calories === 0
                        ? Colors.dark.backgroundTertiary
                        : isOver
                        ? Colors.dark.danger
                        : color,
                    },
                  ]}
                />
              </View>
              <Text style={chartStyles.barLabel}>
                {new Date(d.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                }).slice(0, 1)}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={chartStyles.goalLabel}>Goal: {goal} kcal</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
  sub,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  sub?: string;
}) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, { color }]}>
        {Math.round(value)}{unit}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
      {sub ? <Text style={statStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<View_>("weekly");
  const [weekOffset, setWeekOffset] = useState(0);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() - weekOffset * 7);
  const weekStartStr = formatDate(weekStart);

  const { data: weekly } = useQuery({
    queryKey: ["weekly", weekStartStr],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/analytics/weekly?startDate=${weekStartStr}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: view === "weekly",
  });

  const { data: monthly } = useQuery({
    queryKey: ["monthly", now.getFullYear(), now.getMonth() + 1],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/analytics/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      );
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: view === "monthly",
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const activeData = view === "weekly" ? weekly : monthly;
  const calorieGoal = settings?.dailyCalorieGoal ?? 2000;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const days: DayData[] = activeData?.days ?? [];
  const trackedDays = days.filter((d: DayData) => d.calories > 0);
  const avgCal = activeData?.averageCalories ?? 0;
  const avgProt = activeData?.averageProtein ?? 0;
  const avgCarb = activeData?.averageCarbs ?? 0;
  const avgFat = activeData?.averageFats ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 16,
            paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Analytics</Text>

        {/* View Toggle */}
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, view === "weekly" && styles.toggleActive]}
            onPress={() => {
              setView("weekly");
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.toggleText,
                view === "weekly" && styles.toggleTextActive,
              ]}
            >
              Weekly
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, view === "monthly" && styles.toggleActive]}
            onPress={() => {
              setView("monthly");
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.toggleText,
                view === "monthly" && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </Pressable>
        </View>

        {/* Week Navigation (weekly only) */}
        {view === "weekly" && (
          <View style={styles.weekNav}>
            <Pressable
              onPress={() => {
                setWeekOffset((o) => o + 1);
                Haptics.selectionAsync();
              }}
              style={styles.weekNavBtn}
            >
              <Feather name="chevron-left" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
            <Text style={styles.weekLabel}>
              {weekOffset === 0
                ? "This Week"
                : weekOffset === 1
                ? "Last Week"
                : `${weekOffset} weeks ago`}
            </Text>
            <Pressable
              onPress={() => {
                if (weekOffset > 0) {
                  setWeekOffset((o) => o - 1);
                  Haptics.selectionAsync();
                }
              }}
              style={[styles.weekNavBtn, weekOffset === 0 && { opacity: 0.3 }]}
            >
              <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* Chart */}
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Calories</Text>
            {days.length > 0 ? (
              <BarChart
                data={view === "weekly" ? days : days.slice(0, 30)}
                goal={calorieGoal}
                color={Colors.dark.accent}
              />
            ) : (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyText}>No data yet</Text>
              </View>
            )}
          </View>

        {/* Avg Stats */}
        <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>
              {view === "weekly" ? "Weekly" : "Monthly"} Averages
            </Text>
            <Text style={styles.sectionSub}>
              {trackedDays.length > 0
                ? `Based on ${trackedDays.length} tracked day${trackedDays.length === 1 ? "" : "s"}`
                : "No tracked days yet"}
            </Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Avg Calories"
                value={avgCal}
                unit=" kcal"
                color={Colors.dark.accent}
              />
              <StatCard
                label="Avg Protein"
                value={avgProt}
                unit="g"
                color={Colors.dark.protein}
              />
              <StatCard
                label="Avg Carbs"
                value={avgCarb}
                unit="g"
                color={Colors.dark.carbs}
              />
              <StatCard
                label="Avg Fats"
                value={avgFat}
                unit="g"
                color={Colors.dark.fats}
              />
            </View>
          </View>

        {/* Macro Breakdown */}
        {avgCal > 0 && (
          <View style={styles.macroBreakdown}>
              <Text style={styles.sectionTitle}>Macro Breakdown</Text>
              <View style={styles.macroBar}>
                {(() => {
                  const total = avgProt * 4 + avgCarb * 4 + avgFat * 9;
                  const pPct = total > 0 ? (avgProt * 4) / total : 0;
                  const cPct = total > 0 ? (avgCarb * 4) / total : 0;
                  const fPct = total > 0 ? (avgFat * 9) / total : 0;
                  return (
                    <>
                      <View style={[styles.macroBarSeg, { flex: pPct, backgroundColor: Colors.dark.protein }]} />
                      <View style={[styles.macroBarSeg, { flex: cPct, backgroundColor: Colors.dark.carbs }]} />
                      <View style={[styles.macroBarSeg, { flex: fPct, backgroundColor: Colors.dark.fats }]} />
                    </>
                  );
                })()}
              </View>
              <View style={styles.macroLegend}>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendDot, { backgroundColor: Colors.dark.protein }]} />
                  <Text style={styles.macroLegendText}>Protein</Text>
                </View>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendDot, { backgroundColor: Colors.dark.carbs }]} />
                  <Text style={styles.macroLegendText}>Carbs</Text>
                </View>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendDot, { backgroundColor: Colors.dark.fats }]} />
                  <Text style={styles.macroLegendText}>Fats</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { gap: 8 },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 200,
    paddingBottom: 24,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barTrack: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    borderRadius: 4,
  },
  barLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  goalLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: "right",
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 14,
    alignItems: "center",
    gap: 3,
    minHeight: 80,
    justifyContent: "center",
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: "center",
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.dark.text,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: Colors.dark.accent,
  },
  toggleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  toggleTextActive: {
    color: "#fff",
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  weekNavBtn: { padding: 4 },
  weekLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.dark.text,
    minWidth: 120,
    textAlign: "center",
  },
  chartCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    gap: 8,
  },
  chartTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.dark.text,
  },
  chartEmpty: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  chartEmptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  statsSection: { gap: 10 },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
  },
  sectionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: -6,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  macroBreakdown: {
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    gap: 12,
  },
  macroBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    gap: 2,
  },
  macroBarSeg: {
    borderRadius: 3,
  },
  macroLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  macroLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  macroLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLegendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
