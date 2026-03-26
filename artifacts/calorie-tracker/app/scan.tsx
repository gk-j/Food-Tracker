import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickImage = useCallback(async (fromCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (fromCamera && Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Camera access is required to scan food.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.7,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  }, []);

  const analyze = useCallback(async () => {
    if (!imageUri) return;

    setIsAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let base64: string | undefined;

      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (!base64) throw new Error("Failed to read image");

      const res = await fetch(`${API_BASE}/meals/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();

      router.replace({
        pathname: "/meal-result",
        params: {
          analysis: JSON.stringify(data),
          imageUri: imageUri,
        },
      });
    } catch (err) {
      setIsAnalyzing(false);
      Alert.alert("Analysis failed", "Could not analyze the image. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [imageUri]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="x" size={22} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Food</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Feather name="image" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.placeholderText}>No image selected</Text>
              <Text style={styles.placeholderSub}>
                Take a photo or choose from your gallery
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {Platform.OS !== "web" && (
            <Pressable
              style={styles.actionButton}
              onPress={() => pickImage(true)}
              disabled={isAnalyzing}
            >
              <View style={styles.actionIcon}>
                <Feather name="camera" size={22} color={Colors.dark.accent} />
              </View>
              <Text style={styles.actionLabel}>Camera</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.actionButton}
            onPress={() => pickImage(false)}
            disabled={isAnalyzing}
          >
            <View style={styles.actionIcon}>
              <Feather name="image" size={22} color={Colors.dark.fats} />
            </View>
            <Text style={styles.actionLabel}>Gallery</Text>
          </Pressable>
        </View>

        {/* Tips */}
        <View style={styles.tipCard}>
          <Feather name="info" size={14} color={Colors.dark.accent} />
          <Text style={styles.tipText}>
            For best results, photograph your meal clearly in good lighting. Make sure all food items are visible.
          </Text>
        </View>

        {/* Analyze Button */}
        {imageUri && (
          <Pressable
            style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
            onPress={analyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.analyzeText}>Analyzing your meal...</Text>
              </View>
            ) : (
              <View style={styles.analyzingRow}>
                <Feather name="zap" size={18} color="#fff" />
                <Text style={styles.analyzeText}>Analyze with AI</Text>
              </View>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    gap: 16,
    paddingTop: 8,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  placeholderText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  placeholderSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 16,
    paddingVertical: 18,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  tipCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.dark.accentGlow,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  analyzeButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  analyzeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
  },
});
