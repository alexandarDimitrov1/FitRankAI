import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { loadStoredProfile, saveStoredProfile } from "./src/storage/profileStore";
import { requestPlan, saveProfile } from "./src/api/client";

const defaultProfile = {
  name: "",
  email: "",
  age: "",
  heightCm: "",
  weightKg: ""
};

const defaultAchievements = {
  pushups: "",
  benchKg: "",
  pullups: "",
  squatKg: "",
  deadliftKg: ""
};

const exerciseFields = [
  { key: "pushups", label: "Лицеви опори", suffix: "бр." },
  { key: "benchKg", label: "Лежанка", suffix: "кг" },
  { key: "pullups", label: "Набирания", suffix: "бр." },
  { key: "squatKg", label: "Клек", suffix: "кг" },
  { key: "deadliftKg", label: "Мъртва тяга", suffix: "кг" }
];

export default function App() {
  const [profile, setProfile] = useState(defaultProfile);
  const [achievements, setAchievements] = useState(defaultAchievements);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("Не си влязъл в профил.");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadStoredProfile().then((storedProfile) => {
      if (storedProfile) {
        setProfile(storedProfile);
        setStatus(`Влязъл като ${storedProfile.name || storedProfile.email}`);
      }
    });
  }, []);

  const isProfileReady = useMemo(() => {
    return profile.email && profile.age && profile.heightCm && profile.weightKg;
  }, [profile]);

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateAchievement(key, value) {
    setAchievements((current) => ({ ...current, [key]: value }));
  }

  async function handleSaveProfile() {
    const normalizedProfile = {
      ...profile,
      email: profile.email.trim().toLowerCase(),
      name: profile.name.trim()
    };

    setProfile(normalizedProfile);
    await saveStoredProfile(normalizedProfile);
    const apiResult = await saveProfile(normalizedProfile);
    setStatus(
      apiResult?.storage?.saved
        ? "Профилът е записан във Firebase."
        : "Профилът е запазен на това устройство."
    );
  }

  async function handleGeneratePlan() {
    if (!isProfileReady) {
      setStatus("Попълни профила преди да генерираш план.");
      return;
    }

    setIsGenerating(true);
    const payload = buildPayload(profile, achievements);
    const apiResult = await requestPlan(payload, profile.email);
    const generatedResult = apiResult || buildLocalPlan(payload);
    setResult(generatedResult);
    setStatus(apiResult ? "Планът е генериран от backend-а." : "Планът е генериран локално.");
    setIsGenerating(false);
  }

  function handleLogout() {
    saveStoredProfile(null);
    setProfile(defaultProfile);
    setResult(null);
    setStatus("Излезе от профила.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>AI FITNESS PLATFORM</Text>
        <Text style={styles.title}>FitRank AI</Text>
        <Text style={styles.subtitle}>
          Профил, постижения, FitRank резултат и персонален план.
        </Text>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Профил</Text>
            {profile.email ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
                <Text style={styles.secondaryButtonText}>Изход</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Field
            label="Име"
            value={profile.name}
            onChangeText={(value) => updateProfile("name", value)}
            placeholder="Никола"
          />
          <Field
            label="Имейл"
            value={profile.email}
            onChangeText={(value) => updateProfile("email", value)}
            placeholder="name@example.com"
            autoCapitalize="none"
          />
          <View style={styles.row}>
            <Field
              label="Килограми"
              value={profile.weightKg}
              onChangeText={(value) => updateProfile("weightKg", value)}
              keyboardType="numeric"
              compact
            />
            <Field
              label="Ръст"
              value={profile.heightCm}
              onChangeText={(value) => updateProfile("heightCm", value)}
              keyboardType="numeric"
              compact
            />
            <Field
              label="Възраст"
              value={profile.age}
              onChangeText={(value) => updateProfile("age", value)}
              keyboardType="numeric"
              compact
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>Запази профил</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Постижения</Text>
          {exerciseFields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              value={achievements[field.key]}
              onChangeText={(value) => updateAchievement(field.key, value)}
              keyboardType="numeric"
              suffix={field.suffix}
            />
          ))}
          <TouchableOpacity style={styles.button} onPress={handleGeneratePlan}>
            <Text style={styles.buttonText}>
              {isGenerating ? "Генериране..." : "Generate Plan"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.status}>{status}</Text>

        {result ? (
          <>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>FitRank Score</Text>
              <Text style={styles.scoreValue}>{result.fitRank.score} / 100</Text>
              <Text style={styles.scoreHint}>{result.fitRank.percentileLabel}</Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Седмичен план</Text>
              {result.plan.workouts.map((item) => (
                <Text key={item} style={styles.planItem}>{item}</Text>
              ))}
              <View style={styles.nutritionBox}>
                <Text style={styles.nutritionTitle}>Хранене</Text>
                <Text style={styles.nutritionText}>{result.plan.nutrition.focus}</Text>
                <Text style={styles.nutritionText}>{result.plan.nutrition.macros}</Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  suffix,
  compact,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder = "",
  autoCapitalize = "sentences"
}) {
  return (
    <View style={compact ? styles.fieldCompact : styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          autoCapitalize={autoCapitalize}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function buildPayload(profile, achievements) {
  return {
    biometrics: {
      age: toNumber(profile.age),
      heightCm: toNumber(profile.heightCm),
      weightKg: toNumber(profile.weightKg),
      activityLevel: "moderate"
    },
    exerciseResults: {
      pushups: toNumber(achievements.pushups),
      benchKg: toNumber(achievements.benchKg),
      pullups: toNumber(achievements.pullups),
      squatKg: toNumber(achievements.squatKg),
      deadliftKg: toNumber(achievements.deadliftKg)
    },
    goal: "Подобри сила и обща форма",
    deadlineWeeks: 8
  };
}

function buildLocalPlan(payload) {
  const score = calculateLocalScore(payload);
  const percentileLabel = score >= 85 ? "Top 15%" : score >= 70 ? "Top 35%" : score >= 50 ? "Average" : "Beginner";

  return {
    fitRank: {
      score,
      percentileLabel
    },
    goal: {
      goal: payload.goal,
      deadlineWeeks: payload.deadlineWeeks,
      realism: score >= 70 ? "realistic" : "challenging"
    },
    plan: {
      workouts: [
        "Ден 1: лежанка, лицеви опори и набирания",
        "Ден 2: клек, корем и мобилност",
        "Ден 3: почивка или леко кардио",
        "Ден 4: мъртва тяга, гръб и набирания",
        "Ден 5: цялостна силова тренировка",
        "Ден 6: техника, разтягане и възстановяване",
        "Ден 7: почивка"
      ],
      nutrition: {
        focus: "Висок протеин, достатъчно вода и стабилни хранения.",
        macros: "Започни с около 1.6-2.2 г протеин на кг телесно тегло."
      }
    }
  };
}

function calculateLocalScore(payload) {
  const weight = Math.max(payload.biometrics.weightKg, 1);
  const results = payload.exerciseResults;
  const upperBody = Math.min(100, results.pushups * 1.2 + results.pullups * 5 + (results.benchKg / weight) * 30);
  const lowerBody = Math.min(100, (results.squatKg / weight) * 35 + (results.deadliftKg / weight) * 40);
  return Math.round(Math.max(0, Math.min(100, upperBody * 0.55 + lowerBody * 0.45)));
}

function toNumber(value) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827"
  },
  container: {
    padding: 24,
    gap: 18
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
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  field: {
    gap: 6
  },
  fieldCompact: {
    flex: 1,
    gap: 6,
    minWidth: 0
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700"
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 46,
    paddingHorizontal: 12
  },
  input: {
    color: "#ffffff",
    flex: 1,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: 10
  },
  suffix: {
    color: "#94a3b8",
    fontSize: 13,
    marginLeft: 6
  },
  button: {
    alignItems: "center",
    backgroundColor: "#fb923c",
    borderRadius: 8,
    padding: 14
  },
  buttonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800"
  },
  secondaryButton: {
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  secondaryButtonText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700"
  },
  status: {
    color: "#cbd5e1",
    fontSize: 14
  },
  scoreCard: {
    borderColor: "#fb923c",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 18
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
  },
  planItem: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 20
  },
  nutritionBox: {
    backgroundColor: "#111827",
    borderRadius: 8,
    gap: 6,
    padding: 12
  },
  nutritionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  nutritionText: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20
  }
});
