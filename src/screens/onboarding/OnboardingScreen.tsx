import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { Goal, ActivityLevel, DietPreference } from '@/types';

const { width } = Dimensions.get('window');

const GOALS: { value: Goal; label: string; icon: string; desc: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '🔥', desc: 'Shed extra pounds' },
  { value: 'maintain', label: 'Maintain', icon: '⚖️', desc: 'Stay at current weight' },
  { value: 'gain_muscle', label: 'Gain Muscle', icon: '💪', desc: 'Build lean muscle' },
  { value: 'improve_health', label: 'Improve Health', icon: '❤️', desc: 'Boost overall wellness' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Lightly Active', desc: '1–3 days/week' },
  { value: 'moderate', label: 'Moderately Active', desc: '3–5 days/week' },
  { value: 'active', label: 'Very Active', desc: '6–7 days/week' },
  { value: 'very_active', label: 'Extra Active', desc: 'Twice daily / physical job' },
];

const DIET_PREFS: { value: DietPreference; label: string; icon: string }[] = [
  { value: 'none', label: 'No Restriction', icon: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'keto', label: 'Keto', icon: '🥑' },
  { value: 'paleo', label: 'Paleo', icon: '🥩' },
  { value: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
];

function calculateTargets(
  age: number,
  weightKg: number,
  heightCm: number,
  gender: string,
  goal: Goal,
  activity: ActivityLevel
) {
  const bmr =
    gender === 'female'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * activityMultipliers[activity];
  let calories = tdee;
  if (goal === 'lose_weight') calories = tdee - 500;
  else if (goal === 'gain_muscle') calories = tdee + 300;

  const protein = Math.round((calories * 0.3) / 4);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories * 0.45) / 4);

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
  };
}

export default function OnboardingScreen() {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(profile?.name ?? '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<Goal>('lose_weight');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [diet, setDiet] = useState<DietPreference>('none');

  const targets =
    step === 5 && age && weight && height
      ? calculateTargets(
          parseInt(age),
          parseFloat(weight),
          parseFloat(height),
          gender,
          goal,
          activity
        )
      : null;

  async function handleFinish() {
    if (!targets) return;
    setLoading(true);
    try {
      await updateProfile({
        name,
        gender,
        age: parseInt(age),
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height),
        goal,
        activity_level: activity,
        diet_preference: diet,
        daily_calories: targets.calories,
        daily_protein: targets.protein,
        daily_carbs: targets.carbs,
        daily_fat: targets.fat,
        onboarded: true,
      });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
      setLoading(false);
    }
  }

  function nextStep() {
    if (step === 2) {
      if (!age || !weight || !height) {
        Alert.alert('Missing Info', 'Please fill all fields');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 5));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  const progressWidth = (step / 5) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
      </View>

      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step {step} of 5</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Let&apos;s get to know you</Text>
            <Text style={styles.stepSubtitle}>Tell us your name and gender</Text>

            <Input
              label="Your Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={20} color={Colors.textMuted} />}
            />

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                    {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your body stats</Text>
            <Text style={styles.stepSubtitle}>Used to calculate your calorie targets</Text>

            <Input
              label="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="e.g. 28"
              leftIcon={<Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />}
            />
            <Input
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 70"
              leftIcon={<Ionicons name="barbell-outline" size={20} color={Colors.textMuted} />}
            />
            <Input
              label="Height (cm)"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 175"
              leftIcon={<Ionicons name="resize-outline" size={20} color={Colors.textMuted} />}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your goal</Text>
            <Text style={styles.stepSubtitle}>What are you working towards?</Text>

            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.optionCard, goal === g.value && styles.optionCardActive]}
                onPress={() => setGoal(g.value)}
              >
                <Text style={styles.optionIcon}>{g.icon}</Text>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, goal === g.value && styles.optionLabelActive]}>
                    {g.label}
                  </Text>
                  <Text style={styles.optionDesc}>{g.desc}</Text>
                </View>
                {goal === g.value && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Activity Level</Text>
            {ACTIVITY_LEVELS.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.optionCard, activity === a.value && styles.optionCardActive]}
                onPress={() => setActivity(a.value)}
              >
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, activity === a.value && styles.optionLabelActive]}>
                    {a.label}
                  </Text>
                  <Text style={styles.optionDesc}>{a.desc}</Text>
                </View>
                {activity === a.value && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Diet preference</Text>
            <Text style={styles.stepSubtitle}>We&apos;ll tailor meal suggestions for you</Text>

            <View style={styles.dietGrid}>
              {DIET_PREFS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.dietCard, diet === d.value && styles.dietCardActive]}
                  onPress={() => setDiet(d.value)}
                >
                  <Text style={styles.dietIcon}>{d.icon}</Text>
                  <Text style={[styles.dietLabel, diet === d.value && styles.dietLabelActive]}>
                    {d.label}
                  </Text>
                  {diet === d.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={Colors.primary}
                      style={styles.dietCheck}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 5 && targets && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your plan is ready!</Text>
            <Text style={styles.stepSubtitle}>Here are your personalized daily targets</Text>

            <LinearGradient
              colors={['#22c55e20', '#06b6d420']}
              style={styles.summaryCard}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{targets.calories}</Text>
                  <Text style={styles.summaryLabel}>Calories</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{targets.protein}g</Text>
                  <Text style={styles.summaryLabel}>Protein</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{targets.carbs}g</Text>
                  <Text style={styles.summaryLabel}>Carbs</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{targets.fat}g</Text>
                  <Text style={styles.summaryLabel}>Fat</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.summaryDetails}>
              {[
                { label: 'Name', value: name },
                { label: 'Goal', value: GOALS.find((g) => g.value === goal)?.label },
                { label: 'Activity', value: ACTIVITY_LEVELS.find((a) => a.value === activity)?.label },
                { label: 'Diet', value: DIET_PREFS.find((d) => d.value === diet)?.label },
                { label: 'Age', value: `${age} years` },
                { label: 'Weight', value: `${weight} kg` },
                { label: 'Height', value: `${height} cm` },
              ].map((item) => (
                <View key={item.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.navButtons}>
        {step > 1 && (
          <Button
            title="Back"
            onPress={prevStep}
            variant="outline"
            fullWidth={false}
            style={styles.backBtn}
          />
        )}
        {step < 5 ? (
          <Button
            title="Continue"
            onPress={nextStep}
            fullWidth={step === 1}
            style={step > 1 ? styles.continueBtn : undefined}
          />
        ) : (
          <Button
            title="Start My Journey"
            onPress={handleFinish}
            loading={loading}
            style={styles.continueBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
  },
  stepIndicator: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  stepText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    paddingTop: Spacing.xl,
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  genderBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  genderBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  genderBtnTextActive: {
    color: Colors.primary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  optionIcon: {
    fontSize: 24,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  optionDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dietCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  dietIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  dietLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  dietLabelActive: {
    color: Colors.primary,
  },
  dietCheck: {
    marginTop: Spacing.xs,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  summaryDetails: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  detailValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backBtn: {
    width: 100,
  },
  continueBtn: {
    flex: 1,
  },
});
