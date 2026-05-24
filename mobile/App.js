import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { requestPlan } from "./src/api/client";

const samplePayload = {
  biometrics: {
    age: 22,
    heightCm: 180,
    weightKg: 78,
    activityLevel: "moderate"
  },
  exerciseResults: {
    pushups: 35,
    squats: 55,
    plankSeconds: 120,
    runMinutes: 11
  },
  goal: "Build strength and improve conditioning",
  deadlineWeeks: 8
};

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>AI FITNESS PLATFORM</Text>
        <Text style={styles.title}>FitRank AI</Text>
        <Text style={styles.subtitle}>
          Enter your stats, see your FitRank score, and generate a realistic weekly plan.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Quick Assessment</Text>
          <TextInput style={styles.input} value="35 pushups" editable={false} />
          <TextInput style={styles.input} value="55 squats" editable={false} />
          <TextInput style={styles.input} value="120s plank" editable={false} />
          <TouchableOpacity
            style={styles.button}
            onPress={() => requestPlan(samplePayload)}
          >
            <Text style={styles.buttonText}>Generate Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>FitRank Score</Text>
          <Text style={styles.scoreValue}>87 / 100</Text>
          <Text style={styles.scoreHint}>Top 15% for your category</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827"
  },
  container: {
    padding: 24,
    gap: 20
  },
  eyebrow: {
    color: "#fb923c",
    fontSize: 13,
    fontWeight: "700"
  },
  title: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "800"
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24
  },
  panel: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 16,
    gap: 12
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 8,
    color: "#ffffff",
    padding: 12
  },
  button: {
    backgroundColor: "#fb923c",
    borderRadius: 8,
    padding: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800"
  },
  scoreCard: {
    borderColor: "#fb923c",
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 6
  },
  scoreLabel: {
    color: "#cbd5e1",
    fontSize: 14
  },
  scoreValue: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800"
  },
  scoreHint: {
    color: "#fb923c",
    fontSize: 14,
    fontWeight: "700"
  }
});
