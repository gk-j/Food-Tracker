import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CircularProgress } from "./CircularProgress";
import Colors from "@/constants/colors";

type Props = {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  color: string;
  glow: string;
  isOver?: boolean;
};

export function MacroCard({ label, value, goal, unit = "g", color, glow, isOver }: Props) {
  const progress = goal > 0 ? value / goal : 0;
  const remaining = Math.max(goal - value, 0);
  const over = Math.max(value - goal, 0);

  return (
    <View style={[styles.card, { borderColor: Colors.dark.cardBorder }]}>
      <View style={styles.info}>
        <Text style={[styles.amount, isOver && { color: Colors.dark.danger }]}>
          {isOver ? `${Math.round(over)}${unit}` : `${Math.round(remaining)}${unit}`}
        </Text>
        <Text style={[styles.label, isOver && { color: Colors.dark.danger }]}>
          {label} {isOver ? "over" : "left"}
        </Text>
      </View>
      <CircularProgress
        size={56}
        strokeWidth={4}
        progress={Math.min(progress, 1)}
        color={isOver ? Colors.dark.danger : color}
      >
        <View
          style={[
            styles.innerDot,
            { backgroundColor: isOver ? Colors.dark.danger : color },
          ]}
        />
      </CircularProgress>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 90,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.dark.text,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
