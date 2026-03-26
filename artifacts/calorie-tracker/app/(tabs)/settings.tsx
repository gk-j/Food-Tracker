import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

type Settings = {
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbGoal: number;
  dailyFatGoal: number;
};

type GoalInputProps = {
  label: string;
  value: string;
  unit: string;
  color: string;
  onChangeText: (v: string) => void;
  icon: string;
};

function GoalInput({ label, value, unit, color, onChangeText, icon }: GoalInputProps) {
  return (
    <View style={inputStyles.container}>
      <View style={inputStyles.labelRow}>
        <View style={[inputStyles.iconBox, { backgroundColor: color + "22" }]}>
          <Feather name={icon as any} size={16} color={color} />
        </View>
        <Text style={inputStyles.label}>{label}</Text>
      </View>
      <View style={inputStyles.inputRow}>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={Colors.dark.textMuted}
          selectionColor={color}
        />
        <Text style={inputStyles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    gap: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.dark.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundTertiary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
    padding: 0,
  },
  unit: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [calories, setCalories] = useState("2000");
  const [protein, setProtein] = useState("150");
  const [carbs, setCarbs] = useState("250");
  const [fats, setFats] = useState("65");
  const [isDirty, setIsDirty] = useState(false);

  const { data: settings } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setCalories(String(Math.round(settings.dailyCalorieGoal)));
      setProtein(String(Math.round(settings.dailyProteinGoal)));
      setCarbs(String(Math.round(settings.dailyCarbGoal)));
      setFats(String(Math.round(settings.dailyFatGoal)));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Settings) => {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
      setIsDirty(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert("Error", "Failed to save settings. Please try again.");
    },
  });

  const handleSave = () => {
    const c = parseFloat(calories) || 2000;
    const p = parseFloat(protein) || 150;
    const cb = parseFloat(carbs) || 250;
    const f = parseFloat(fats) || 65;

    saveMutation.mutate({
      dailyCalorieGoal: c,
      dailyProteinGoal: p,
      dailyCarbGoal: cb,
      dailyFatGoal: f,
    });
  };

  const markDirty = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setIsDirty(true);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.dark.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSub}>Set your daily nutrition goals</Text>

        <View style={styles.section}>
            <Text style={styles.sectionLabel}>Daily Goals</Text>
            <View style={styles.goalsList}>
              <GoalInput
                label="Calories"
                value={calories}
                unit="kcal"
                color={Colors.dark.accent}
                icon="zap"
                onChangeText={markDirty(setCalories)}
              />
              <GoalInput
                label="Protein"
                value={protein}
                unit="g"
                color={Colors.dark.protein}
                icon="activity"
                onChangeText={markDirty(setProtein)}
              />
              <GoalInput
                label="Carbohydrates"
                value={carbs}
                unit="g"
                color={Colors.dark.carbs}
                icon="sun"
                onChangeText={markDirty(setCarbs)}
              />
              <GoalInput
                label="Fats"
                value={fats}
                unit="g"
                color={Colors.dark.fats}
                icon="droplet"
                onChangeText={markDirty(setFats)}
              />
            </View>
          </View>

        {/* Macro preview */}
        <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Calorie Breakdown</Text>
            <Text style={styles.previewSub}>Based on your macro goals</Text>
            {(() => {
              const p = parseFloat(protein) || 0;
              const c = parseFloat(carbs) || 0;
              const f = parseFloat(fats) || 0;
              const total = p * 4 + c * 4 + f * 9;
              const pPct = total > 0 ? ((p * 4) / total) * 100 : 0;
              const cPct = total > 0 ? ((c * 4) / total) * 100 : 0;
              const fPct = total > 0 ? ((f * 9) / total) * 100 : 0;
              return (
                <>
                  <View style={styles.macroBar}>
                    <View
                      style={[
                        styles.macroBarSeg,
                        { flex: pPct || 1, backgroundColor: Colors.dark.protein },
                      ]}
                    />
                    <View
                      style={[
                        styles.macroBarSeg,
                        { flex: cPct || 1, backgroundColor: Colors.dark.carbs },
                      ]}
                    />
                    <View
                      style={[
                        styles.macroBarSeg,
                        { flex: fPct || 1, backgroundColor: Colors.dark.fats },
                      ]}
                    />
                  </View>
                  <View style={styles.macroBreakdownLabels}>
                    <Text style={[styles.macroBreakdownLabel, { color: Colors.dark.protein }]}>
                      P: {pPct.toFixed(0)}%
                    </Text>
                    <Text style={[styles.macroBreakdownLabel, { color: Colors.dark.carbs }]}>
                      C: {cPct.toFixed(0)}%
                    </Text>
                    <Text style={[styles.macroBreakdownLabel, { color: Colors.dark.fats }]}>
                      F: {fPct.toFixed(0)}%
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>

        {/* About Section */}
        <View style={styles.aboutCard}>
            <Feather name="zap" size={20} color={Colors.dark.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aboutTitle}>NutriSnap</Text>
              <Text style={styles.aboutSub}>
                AI-powered food tracking. Take a photo of any meal and get instant nutritional info.
              </Text>
            </View>
          </View>

        {/* Save Button */}
        {isDirty && (
          <Pressable
            style={[styles.saveButton, saveMutation.isPending && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saveMutation.isPending}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveText}>
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.dark.text,
  },
  screenSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: -10,
  },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.dark.text,
  },
  goalsList: { gap: 10 },
  previewCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    gap: 10,
  },
  previewTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.dark.text,
  },
  previewSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: -6,
  },
  macroBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    gap: 2,
  },
  macroBarSeg: { borderRadius: 3 },
  macroBreakdownLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroBreakdownLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  aboutCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  aboutTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.dark.text,
  },
  aboutSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
