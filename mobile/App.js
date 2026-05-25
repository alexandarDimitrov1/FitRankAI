import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { requestPlan, saveProfile } from "./src/api/client";
import { loadStoredProfile, saveStoredProfile } from "./src/storage/profileStore";

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

const defaultGoal = {
  deadlineWeeks: "8"
};

const exerciseFields = [
  { key: "pushups", label: "Лицеви опори", suffix: "бр." },
  { key: "benchKg", label: "Лежанка", suffix: "кг" },
  { key: "pullups", label: "Набирания", suffix: "бр." },
  { key: "squatKg", label: "Клек", suffix: "кг" },
  { key: "deadliftKg", label: "Мъртва тяга", suffix: "кг" }
];

const realismLabels = {
  realistic: "Реалистична цел",
  challenging: "Трудна, но възможна цел",
  intensive: "Кратък срок, нужен е по-силен режим",
  unrealistic: "Нереалистична цел"
};

const exerciseGuides = [
  {
    key: "pushups",
    title: "Лицеви опори",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Airman%20doing%20pushup.JPG?width=640",
    sourceUrl: "https://exrx.net/WeightExercises/PectoralSternal/BWPushup",
    muscles: "Гърди, рамене, трицепс и корем",
    cues: [
      "Дръж тялото в права линия от главата до петите.",
      "Ръцете са малко по-широко от раменете.",
      "Слизай контролирано и избутвай нагоре без да отпускаш кръста."
    ],
    mistakes: "Не вдигай таза много високо и не оставяй кръста да пропада."
  },
  {
    key: "benchKg",
    title: "Лежанка",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Bench%20Press.jpg?width=640",
    sourceUrl: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress",
    muscles: "Гърди, предно рамо и трицепс",
    cues: [
      "Стъпалата са стабилно на земята, гърбът е стегнат.",
      "Спускай лоста към долната част на гърдите.",
      "Избутвай нагоре с контрол, без да отлепяш седалището."
    ],
    mistakes: "Не пускай лоста да пада и не отваряй лактите прекалено встрани."
  },
  {
    key: "pullups",
    title: "Набирания",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Girl%20doing%20pull%20up%20top%20position.jpg?width=640",
    sourceUrl: "https://exrx.net/WeightExercises/LatissimusDorsi/BWPullup",
    muscles: "Гръб, бицепс, предмишници и задно рамо",
    cues: [
      "Хвани лоста с надхват и стегни корема.",
      "Дърпай гърдите към лоста, докато брадичката мине над него.",
      "Спускай до почти изпънати ръце без люлеене."
    ],
    mistakes: "Не скъсявай повторенията и не използвай засилка, ако целта е сила."
  },
  {
    key: "squatKg",
    title: "Клек",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Woman%20doing%20squat%20workout%20in%20gym%20with%20barbell.jpg?width=640",
    sourceUrl: "https://exrx.net/WeightExercises/Quadriceps/BBSquat",
    muscles: "Квадрицепс, седалище, задно бедро и корем",
    cues: [
      "Стъпи стабилно, приблизително на ширината на раменете.",
      "Дръж гърдите високо и коленете в посоката на пръстите.",
      "Слизай поне до паралел, после избутвай през средата на стъпалото."
    ],
    mistakes: "Не събирай коленете навътре и не губи неутрален гръб."
  },
  {
    key: "deadliftKg",
    title: "Мъртва тяга",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Deadlift%20%283%29.JPG?width=640",
    sourceUrl: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift",
    muscles: "Гръб, седалище, задно бедро, квадрицепс и хват",
    cues: [
      "Лостът започва близо до пищялите, стъпалата са стабилни.",
      "Стегни корема и дръж гърба неутрален преди дърпането.",
      "Изправяй се чрез бедра и колене, като лостът стои близо до тялото."
    ],
    mistakes: "Не дърпай с кръгъл гръб и не оставяй лоста да се отдалечава от тялото."
  }
];

export default function App() {
  const [screen, setScreen] = useState("login");
  const [guideBackScreen, setGuideBackScreen] = useState("assessment");
  const [profile, setProfile] = useState(defaultProfile);
  const [achievements, setAchievements] = useState(defaultAchievements);
  const [targets, setTargets] = useState(defaultAchievements);
  const [goal, setGoal] = useState(defaultGoal);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("Влез в профила си, за да започнеш.");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadStoredProfile().then((storedProfile) => {
      if (storedProfile?.email) {
        setProfile(storedProfile);
        setScreen("assessment");
        setStatus(`Влязъл като ${storedProfile.name || storedProfile.email}`);
      }
    });
  }, []);

  const isLoginReady = useMemo(() => {
    return profile.name.trim() && profile.email.trim();
  }, [profile.email, profile.name]);

  const isAssessmentReady = useMemo(() => {
    return (
      profile.age &&
      profile.heightCm &&
      profile.weightKg &&
      goal.deadlineWeeks &&
      hasAnyTarget(targets)
    );
  }, [goal.deadlineWeeks, profile.age, profile.heightCm, profile.weightKg, targets]);

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateAchievement(key, value) {
    setAchievements((current) => ({ ...current, [key]: value }));
  }

  function updateTarget(key, value) {
    setTargets((current) => ({ ...current, [key]: value }));
  }

  async function handleLogin() {
    if (!isLoginReady) {
      setStatus("Напиши име и имейл, за да влезеш.");
      return;
    }

    const normalizedProfile = normalizeProfile(profile);
    setProfile(normalizedProfile);
    await saveStoredProfile(normalizedProfile);
    const apiResult = await saveProfile(normalizedProfile);
    setStatus(
      apiResult?.storage?.saved
        ? "Профилът е записан във Firebase."
        : "Профилът е запазен на това устройство."
    );
    setScreen("assessment");
  }

  async function handleGeneratePlan() {
    if (!isAssessmentReady) {
      setStatus("Попълни данните, поне една цел и срок за постигане.");
      return;
    }

    setIsGenerating(true);
    const normalizedProfile = normalizeProfile(profile);
    setProfile(normalizedProfile);
    await saveStoredProfile(normalizedProfile);

    const payload = buildPayload(normalizedProfile, achievements, targets, goal);
    const apiResult = await requestPlan(payload, normalizedProfile.email);
    const generatedResult = apiResult || buildLocalPlan(payload);

    setResult(generatedResult);
    setStatus(apiResult ? "Планът е генериран от backend-а." : "Планът е генериран локално.");
    setScreen("plan");
    setIsGenerating(false);
  }

  function handleLogout() {
    saveStoredProfile(null);
    setProfile(defaultProfile);
    setAchievements(defaultAchievements);
    setTargets(defaultAchievements);
    setGoal(defaultGoal);
    setResult(null);
    setScreen("login");
    setStatus("Излезе от профила.");
  }

  function openExerciseGuides(backScreen) {
    setGuideBackScreen(backScreen);
    setScreen("exercises");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Header screen={screen} />
        {screen === "login" ? (
          <LoginScreen
            profile={profile}
            status={status}
            onLogin={handleLogin}
            onProfileChange={updateProfile}
          />
        ) : null}

        {screen === "assessment" ? (
          <AssessmentScreen
            achievements={achievements}
            goal={goal}
            isGenerating={isGenerating}
            profile={profile}
            status={status}
            targets={targets}
            onAchievementChange={updateAchievement}
            onGeneratePlan={handleGeneratePlan}
            onGoalChange={(key, value) => setGoal((current) => ({ ...current, [key]: value }))}
            onLogout={handleLogout}
            onOpenExercises={() => openExerciseGuides("assessment")}
            onProfileChange={updateProfile}
            onTargetChange={updateTarget}
          />
        ) : null}

        {screen === "plan" && result ? (
          <PlanScreen
            result={result}
            onBack={() => setScreen("assessment")}
            onOpenExercises={() => openExerciseGuides("plan")}
            onLogout={handleLogout}
          />
        ) : null}

        {screen === "exercises" ? (
          <ExerciseGuideScreen onBack={() => setScreen(guideBackScreen)} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ screen }) {
  const steps = [
    { key: "login", label: "1. Вход" },
    { key: "assessment", label: "2. Данни" },
    { key: "plan", label: "3. План" },
    { key: "exercises", label: "Техника" }
  ];

  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>AI FITNESS PLATFORM</Text>
      <Text style={styles.title}>FitRank AI</Text>
      <Text style={styles.subtitle}>Профил, цели, реалистична оценка и персонален режим.</Text>
      <View style={styles.steps}>
        {steps.map((step) => (
          <View
            key={step.key}
            style={[styles.stepPill, screen === step.key ? styles.stepPillActive : null]}
          >
            <Text
              style={[styles.stepText, screen === step.key ? styles.stepTextActive : null]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LoginScreen({ profile, status, onLogin, onProfileChange }) {
  return (
    <>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Вход</Text>
        <Text style={styles.panelHint}>Създай профил с име и имейл. След това данните ти се пазят за следващото влизане.</Text>
        <Field
          label="Име"
          value={profile.name}
          onChangeText={(value) => onProfileChange("name", value)}
          placeholder="Например Алекс"
        />
        <Field
          autoCapitalize="none"
          label="Имейл"
          value={profile.email}
          onChangeText={(value) => onProfileChange("email", value)}
          placeholder="name@example.com"
        />
        <TouchableOpacity style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Влез</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.status}>{status}</Text>
    </>
  );
}

function AssessmentScreen({
  achievements,
  goal,
  isGenerating,
  profile,
  status,
  targets,
  onAchievementChange,
  onGeneratePlan,
  onGoalChange,
  onLogout,
  onOpenExercises,
  onProfileChange,
  onTargetChange
}) {
  return (
    <>
      <View style={styles.profileBar}>
        <View>
          <Text style={styles.profileName}>{profile.name || "Профил"}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={onLogout}>
          <Text style={styles.secondaryButtonText}>Изход</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.secondaryActionButton} onPress={onOpenExercises}>
        <Text style={styles.secondaryActionText}>Виж техниката на упражненията</Text>
      </TouchableOpacity>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Данни за тялото</Text>
        <View style={styles.row}>
          <Field
            compact
            keyboardType="numeric"
            label="Килограми"
            value={profile.weightKg}
            onChangeText={(value) => onProfileChange("weightKg", value)}
          />
          <Field
            compact
            keyboardType="numeric"
            label="Ръст"
            value={profile.heightCm}
            onChangeText={(value) => onProfileChange("heightCm", value)}
          />
          <Field
            compact
            keyboardType="numeric"
            label="Възраст"
            value={profile.age}
            onChangeText={(value) => onProfileChange("age", value)}
          />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Текущи постижения</Text>
        {exerciseFields.map((field) => (
          <Field
            key={field.key}
            keyboardType="numeric"
            label={field.label}
            suffix={field.suffix}
            value={achievements[field.key]}
            onChangeText={(value) => onAchievementChange(field.key, value)}
          />
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Цел за напред</Text>
        <Text style={styles.panelHint}>Напиши какви резултати искаш да стигнеш. Планът ще се нагласи по целта и срока.</Text>
        {exerciseFields.map((field) => (
          <Field
            key={field.key}
            keyboardType="numeric"
            label={`Цел: ${field.label}`}
            suffix={field.suffix}
            value={targets[field.key]}
            onChangeText={(value) => onTargetChange(field.key, value)}
          />
        ))}
        <Field
          keyboardType="numeric"
          label="За колко седмици?"
          suffix="седм."
          value={goal.deadlineWeeks}
          onChangeText={(value) => onGoalChange("deadlineWeeks", value)}
        />
        <TouchableOpacity style={styles.button} onPress={onGeneratePlan}>
          <Text style={styles.buttonText}>{isGenerating ? "Генериране..." : "Генерирай план"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{status}</Text>
    </>
  );
}

function PlanScreen({ result, onBack, onLogout, onOpenExercises }) {
  const goal = result.goal || {};
  const workouts = result.plan?.workouts || [];
  const nutrition = result.plan?.nutrition || {};

  return (
    <>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>FitRank Score</Text>
        <Text style={styles.scoreValue}>{result.fitRank.score} / 100</Text>
        <Text style={styles.scoreHint}>{result.fitRank.percentileLabel}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{realismLabels[goal.realism] || "Оценка на целта"}</Text>
        <Text style={styles.goalMessage}>{goal.message}</Text>
        <View style={styles.summaryGrid}>
          <Metric label="Целеви резултат" value={`${goal.targetScore ?? result.fitRank.score} / 100`} />
          <Metric label="Срок" value={`${goal.deadlineWeeks || 8} седм.`} />
          <Metric label="Тренировки" value={`${goal.trainingDays || 4} дни`} />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Тренировъчен план</Text>
        {workouts.map((item) => (
          <Text key={item} style={styles.planItem}>{item}</Text>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Хранене</Text>
        <View style={styles.nutritionBox}>
          <Text style={styles.nutritionTitle}>Фокус</Text>
          <Text style={styles.nutritionText}>{nutrition.focus}</Text>
        </View>
        <View style={styles.nutritionBox}>
          <Text style={styles.nutritionTitle}>Макроси</Text>
          <Text style={styles.nutritionText}>{nutrition.macros}</Text>
        </View>
        {nutrition.meals ? (
          <View style={styles.nutritionBox}>
            <Text style={styles.nutritionTitle}>Примерни хранения</Text>
            <Text style={styles.nutritionText}>{nutrition.meals}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryActionButton} onPress={onBack}>
          <Text style={styles.secondaryActionText}>Промени данните</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryActionButton} onPress={onOpenExercises}>
          <Text style={styles.secondaryActionText}>Техника</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonCompact} onPress={onLogout}>
          <Text style={styles.buttonText}>Изход</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function ExerciseGuideScreen({ onBack }) {
  return (
    <>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Техника на упражненията</Text>
        <Text style={styles.panelHint}>
          Виж основните точки за изпълнение преди да гониш по-голяма тежест или повече повторения.
        </Text>
      </View>

      {exerciseGuides.map((exercise) => (
        <View key={exercise.key} style={styles.guideCard}>
          <Image
            source={{ uri: exercise.image }}
            style={styles.guideImage}
            resizeMode="contain"
          />
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>{exercise.title}</Text>
            <Text style={styles.guideMeta}>{exercise.muscles}</Text>
            {exercise.cues.map((cue) => (
              <Text key={cue} style={styles.cueText}>• {cue}</Text>
            ))}
            <Text style={styles.warningText}>{exercise.mistakes}</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(exercise.sourceUrl)}
            >
              <Text style={styles.linkText}>Отвори пълното обяснение</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Назад</Text>
      </TouchableOpacity>
    </>
  );
}

function Field({
  autoCapitalize = "sentences",
  compact,
  keyboardType = "default",
  label,
  onChangeText,
  placeholder = "",
  suffix,
  value
}) {
  return (
    <View style={compact ? styles.fieldCompact : styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          style={styles.input}
          value={value}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function normalizeProfile(profile) {
  return {
    ...profile,
    email: profile.email.trim().toLowerCase(),
    name: profile.name.trim()
  };
}

function buildPayload(profile, achievements, targets, goal) {
  const exerciseResults = normalizeResults(achievements);

  return {
    biometrics: {
      age: toNumber(profile.age),
      heightCm: toNumber(profile.heightCm),
      weightKg: toNumber(profile.weightKg),
      activityLevel: "moderate"
    },
    exerciseResults,
    goalTargets: normalizeTargetResults(achievements, targets),
    goal: buildGoalSummary(targets),
    deadlineWeeks: Math.max(1, Math.round(toNumber(goal.deadlineWeeks) || 8))
  };
}

function normalizeResults(values) {
  return {
    pushups: toNumber(values.pushups),
    benchKg: toNumber(values.benchKg),
    pullups: toNumber(values.pullups),
    squatKg: toNumber(values.squatKg),
    deadliftKg: toNumber(values.deadliftKg)
  };
}

function normalizeTargetResults(currentValues, targetValues) {
  const current = normalizeResults(currentValues);
  const target = normalizeResults(targetValues);

  return {
    pushups: target.pushups || current.pushups,
    benchKg: target.benchKg || current.benchKg,
    pullups: target.pullups || current.pullups,
    squatKg: target.squatKg || current.squatKg,
    deadliftKg: target.deadliftKg || current.deadliftKg
  };
}

function buildGoalSummary(targets) {
  const filled = exerciseFields
    .filter((field) => toNumber(targets[field.key]) > 0)
    .map((field) => `${field.label}: ${targets[field.key]} ${field.suffix}`);

  return filled.length ? filled.join(", ") : "Подобри сила и обща форма";
}

function buildLocalPlan(payload) {
  const score = calculateLocalScore(payload.exerciseResults, payload.biometrics.weightKg);
  const targetScore = calculateLocalScore(payload.goalTargets, payload.biometrics.weightKg);
  const goalResult = evaluateLocalGoal(payload, score, targetScore);

  return {
    fitRank: {
      score,
      percentileLabel: percentileLabel(score),
      breakdown: {
        targetScore
      }
    },
    goal: goalResult,
    plan: buildLocalWorkoutPlan(goalResult)
  };
}

function evaluateLocalGoal(payload, score, targetScore) {
  const deadline = Math.max(1, payload.deadlineWeeks || 8);
  const scoreGap = Math.max(0, targetScore - score);
  const weeklyGainNeeded = scoreGap / deadline;
  let realism = "realistic";

  if ((targetScore >= 92 && deadline < 10) || weeklyGainNeeded > 5) {
    realism = "unrealistic";
  } else if (weeklyGainNeeded > 3 || deadline <= 4) {
    realism = "intensive";
  } else if (weeklyGainNeeded > 1.8) {
    realism = "challenging";
  }

  const trainingDays = {
    realistic: 4,
    challenging: 5,
    intensive: 6,
    unrealistic: 4
  }[realism];

  return {
    goal: payload.goal,
    deadlineWeeks: deadline,
    realism,
    scoreGap: Math.round(scoreGap),
    targetScore,
    trainingDays,
    weeklyGainNeeded: Number(weeklyGainNeeded.toFixed(1)),
    message: goalMessage(realism)
  };
}

function buildLocalWorkoutPlan(goalResult) {
  const workoutsByRealism = {
    realistic: [
      "Ден 1: Лежанка 4x5, дъмбел прес 3x8, лицеви опори 3xмакс, трицепс разгъване 3x12. Почивка 2-3 мин.",
      "Ден 2: Клек 4x5, румънска тяга 3x8, напади 3x10 на крак, планк 3x45 сек. Почивка 2-3 мин.",
      "Ден 3: Леко кардио 25 мин, мобилност за рамене и бедра 15 мин, разтягане.",
      "Ден 4: Мъртва тяга 4x4, набирания 4xмакс, гребане с дъмбел 3x10, face pull 3x15. Почивка 2-3 мин.",
      "Ден 5: Техника: лежанка 3x8 с лека тежест, клек 3x8, лицеви опори 3x12, корем 3 кръга."
    ],
    challenging: [
      "Ден 1: Тежка лежанка 5x4, дъмбел прес 4x8, лицеви опори 4xмакс, трицепс кофички 3x8. Почивка 3 мин.",
      "Ден 2: Клек 5x4, преден клек 3x6, напади 3x10, корем 4 серии. Почивка 3 мин.",
      "Ден 3: Набирания 5xмакс, гребане 4x8, бицепс 3x12, лека мобилност за гръб.",
      "Ден 4: Мъртва тяга 5x3, румънска тяга 3x8, хип тръст 3x10, задно бедро 3x12.",
      "Ден 5: Обем за целта: избери най-слабото упражнение и направи 6 леки серии по 6-10 повторения.",
      "Ден 6: Леко кардио 20 мин, разтягане, техника с празен лост."
    ],
    intensive: [
      "Ден 1: Лежанка 5x3, дъмбел прес 4x8, лицеви опори 5xмакс, трицепс 4x12. Почивка 3 мин.",
      "Ден 2: Клек 5x3, паузиран клек 4x5, напади 3x12, планк 4x45 сек.",
      "Ден 3: Набирания 6 серии, негативни набирания 3x5, гребане 4x10, бицепс 3x12.",
      "Ден 4: Мъртва тяга 5x3, румънска тяга 4x6, хип тръст 4x8, задно бедро 3x12.",
      "Ден 5: Повторение на целта: 70% тежест, 6x4 за основното упражнение, после 3 помощни упражнения по 3 серии.",
      "Ден 6: Лек обем: лицеви опори 4x12, клек с лека тежест 3x10, набирания 4xсубмакс, мобилност.",
      "Ден 7: Пълна почивка, сън, разходка и подготовка за следващата седмица."
    ],
    unrealistic: [
      "Седмица 1: Избери междинна цел: +5-10% сила или +2-5 повторения, вместо огромен скок наведнъж.",
      "Ден 1: Лежанка 4x6 с умерена тежест, дъмбел прес 3x10, лицеви опори 3xмакс.",
      "Ден 2: Клек 4x6, румънска тяга 3x8, напади 3x10, мобилност за глезени и бедра.",
      "Ден 4: Мъртва тяга 4x4, набирания 4xсубмакс, гребане 3x10, face pull 3x15.",
      "Ден 6: Техника и възстановяване: празен лост 20 мин, разтягане, леко кардио 15-20 мин."
    ]
  };

  const nutritionByRealism = {
    realistic: {
      focus: "Стабилен протеин, нормални порции и постоянство.",
      macros: "Около 1.6-2.0 г протеин на кг телесно тегло.",
      meals: "Яйца или кисело мляко, месо/риба с ориз или картофи, плодове и вода."
    },
    challenging: {
      focus: "Повече протеин и лек калориен излишък в тренировъчните дни.",
      macros: "Около 1.8-2.2 г протеин на кг и въглехидрати около тренировките.",
      meals: "Овес с мляко, пилешко с ориз, банан преди тренировка, извара вечер."
    },
    intensive: {
      focus: "По-сериозно хранене, повече сън и следене на възстановяването.",
      macros: "2.0-2.2 г протеин на кг, повече въглехидрати и достатъчно калории.",
      meals: "Закуска с овес и яйца, обяд с месо и ориз, след тренировка банан и протеин, вечеря с картофи и месо."
    },
    unrealistic: {
      focus: "Целта е прекалено агресивна. Първо избери междинна цел, за да не рискуваш травма.",
      macros: "Поддържай протеин 1.8-2.0 г на кг и не режи калории рязко.",
      meals: "Яж редовно и следи силата всяка седмица, вместо да гониш огромен скок наведнъж."
    }
  };

  return {
    workouts: workoutsByRealism[goalResult.realism],
    nutrition: nutritionByRealism[goalResult.realism]
  };
}

function hasAnyTarget(targets) {
  return exerciseFields.some((field) => toNumber(targets[field.key]) > 0);
}

function calculateLocalScore(results, weightKg) {
  const weight = Math.max(weightKg, 1);
  const upperBody = Math.min(
    100,
    results.pushups * 1.2 + results.pullups * 5 + (results.benchKg / weight) * 30
  );
  const lowerBody = Math.min(
    100,
    (results.squatKg / weight) * 35 + (results.deadliftKg / weight) * 40
  );

  return Math.round(Math.max(0, Math.min(100, upperBody * 0.55 + lowerBody * 0.45)));
}

function percentileLabel(score) {
  if (score >= 85) {
    return "Top 15%";
  }
  if (score >= 70) {
    return "Top 35%";
  }
  if (score >= 50) {
    return "Average";
  }
  return "Beginner";
}

function goalMessage(realism) {
  const messages = {
    realistic: "Целта изглежда постижима с постоянни тренировки и нормално възстановяване.",
    challenging: "Целта е възможна, но ще трябва да тренираш по-редовно и да следиш храненето.",
    intensive: "Целта е реалистична само с по-чести тренировки, повече храна и добър сън.",
    unrealistic: "Целта е прекалено голяма за този срок. Удължи периода или избери междинна цел."
  };

  return messages[realism];
}

function toNumber(value) {
  const parsed = Number(String(value || "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827"
  },
  container: {
    gap: 18,
    padding: 24
  },
  header: {
    gap: 10
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
    lineHeight: 23
  },
  steps: {
    flexDirection: "row",
    gap: 8
  },
  stepPill: {
    backgroundColor: "#1f2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  stepPillActive: {
    backgroundColor: "#fb923c",
    borderColor: "#fb923c"
  },
  stepText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  stepTextActive: {
    color: "#111827"
  },
  panel: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    gap: 12,
    padding: 16
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800"
  },
  panelHint: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20
  },
  profileBar: {
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16
  },
  profileName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800"
  },
  profileEmail: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 3
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
    minHeight: 48,
    justifyContent: "center",
    padding: 14
  },
  buttonCompact: {
    alignItems: "center",
    backgroundColor: "#fb923c",
    borderRadius: 8,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14
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
  secondaryActionButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  secondaryActionText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "800"
  },
  status: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20
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
  goalMessage: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 21
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10
  },
  metricBox: {
    backgroundColor: "#111827",
    borderRadius: 8,
    flex: 1,
    gap: 4,
    minHeight: 76,
    justifyContent: "center",
    padding: 10
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700"
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  },
  planItem: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 20
  },
  guideCard: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    overflow: "hidden"
  },
  guideImage: {
    backgroundColor: "#0f172a",
    height: 240,
    width: "100%"
  },
  guideContent: {
    gap: 9,
    padding: 16
  },
  guideTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800"
  },
  guideMeta: {
    color: "#fb923c",
    fontSize: 13,
    fontWeight: "800"
  },
  cueText: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 20
  },
  warningText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  linkButton: {
    alignItems: "center",
    borderColor: "#fb923c",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
    marginTop: 2
  },
  linkText: {
    color: "#fb923c",
    fontSize: 14,
    fontWeight: "800"
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
  },
  actionRow: {
    flexDirection: "row",
    gap: 10
  }
});
