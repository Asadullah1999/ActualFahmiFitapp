import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { Goal, ActivityLevel, DietPreference, RootNavigatorParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootNavigatorParamList>;

function calcBMI(weight: number, height: number) {
  const h = height / 100;
  return +(weight / (h * h)).toFixed(1);
}

function calcTargets(
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
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  let cals = bmr * multipliers[activity];
  if (goal === 'lose_weight') cals -= 500;
  else if (goal === 'gain_muscle') cals += 300;
  return {
    calories: Math.round(cals),
    protein: Math.round((cals * 0.3) / 4),
    carbs: Math.round((cals * 0.45) / 4),
    fat: Math.round((cals * 0.25) / 9),
  };
}

const GOALS: { value: Goal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain_muscle', label: 'Gain Muscle' },
  { value: 'improve_health', label: 'Improve Health' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Lightly Active' },
  { value: 'moderate', label: 'Moderately Active' },
  { value: 'active', label: 'Very Active' },
  { value: 'very_active', label: 'Extra Active' },
];

const DIET_PREFS: { value: DietPreference; label: string }[] = [
  { value: 'none', label: 'No Restriction' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Gluten-Free' },
];

export default function ProfileScreen() {
  const { profile, updateProfile, signOut } = useAuth();
  const navigation = useNavigation<Nav>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(String(profile?.age ?? ''));
  const [weight, setWeight] = useState(String(profile?.weight_kg ?? ''));
  const [height, setHeight] = useState(String(profile?.height_cm ?? ''));
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'maintain');
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity_level ?? 'moderate');
  const [diet, setDiet] = useState<DietPreference>(profile?.diet_preference ?? 'none');

  async function saveProfile() {
    setSaving(true);
    try {
      const a = parseInt(age);
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const targets = a && w && h
        ? calcTargets(a, w, h, profile?.gender ?? 'male', goal, activity)
        : null;

      await updateProfile({
        name,
        age: a || undefined,
        weight_kg: w || undefined,
        height_cm: h || undefined,
        goal,
        activity_level: activity,
        diet_preference: diet,
        ...(targets ?? {}),
        daily_calories: targets?.calories,
        daily_protein: targets?.protein,
        daily_carbs: targets?.carbs,
        daily_fat: targets?.fat,
      });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  const bmi =
    profile?.weight_kg && profile?.height_cm
      ? calcBMI(profile.weight_kg, profile.height_cm)
      : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <LinearGradient colors={['#1a1d27', '#0f1117']} style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#22c55e', '#06b6d4']} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        <Text style={styles.profileName}>{profile?.name ?? 'User'}</Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>
        <View style={styles.profileBadges}>
          {profile?.goal && (
            <Badge
              label={GOALS.find((g) => g.value === profile.goal)?.label ?? ''}
              variant="primary"
              small
            />
          )}
          {profile?.diet_preference && profile.diet_preference !== 'none' && (
            <Badge
              label={DIET_PREFS.find((d) => d.value === profile.diet_preference)?.label ?? ''}
              variant="accent"
              small
            />
          )}
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Calories', value: `${profile?.daily_calories ?? '--'}`, unit: 'kcal', color: Colors.primary },
          { label: 'Protein', value: `${profile?.daily_protein ?? '--'}`, unit: 'g', color: Colors.secondary },
          { label: 'BMI', value: bmi ? `${bmi}` : '--', unit: '', color: Colors.accent },
          { label: 'Weight', value: profile?.weight_kg ? `${profile.weight_kg}` : '--', unit: 'kg', color: Colors.warning },
        ].map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>
              {s.value}
              {s.unit ? <Text style={styles.statUnit}>{s.unit}</Text> : null}
            </Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Card>
        ))}
      </View>

      {/* Edit Profile */}
      {!editing ? (
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Personal Info</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {[
            { label: 'Name', value: profile?.name },
            { label: 'Age', value: profile?.age ? `${profile.age} years` : '--' },
            { label: 'Height', value: profile?.height_cm ? `${profile.height_cm} cm` : '--' },
            { label: 'Weight', value: profile?.weight_kg ? `${profile.weight_kg} kg` : '--' },
            { label: 'Gender', value: profile?.gender ?? '--' },
            { label: 'Goal', value: GOALS.find((g) => g.value === profile?.goal)?.label ?? '--' },
            { label: 'Activity', value: ACTIVITY_LEVELS.find((a) => a.value === profile?.activity_level)?.label ?? '--' },
            { label: 'Diet', value: DIET_PREFS.find((d) => d.value === profile?.diet_preference)?.label ?? '--' },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value ?? '--'}</Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card style={styles.editCard}>
          <Text style={styles.editCardTitle}>Edit Profile</Text>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            leftIcon={<Ionicons name="person-outline" size={20} color={Colors.textMuted} />}
          />
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

          <Text style={styles.selectLabel}>Goal</Text>
          <View style={styles.selectGrid}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.selectBtn, goal === g.value && styles.selectBtnActive]}
                onPress={() => setGoal(g.value)}
              >
                <Text style={[styles.selectBtnText, goal === g.value && styles.selectBtnTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.selectLabel}>Activity Level</Text>
          <View style={styles.selectGrid}>
            {ACTIVITY_LEVELS.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.selectBtn, activity === a.value && styles.selectBtnActive]}
                onPress={() => setActivity(a.value)}
              >
                <Text style={[styles.selectBtnText, activity === a.value && styles.selectBtnTextActive]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.selectLabel}>Diet Preference</Text>
          <View style={styles.selectGrid}>
            {DIET_PREFS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.selectBtn, diet === d.value && styles.selectBtnActive]}
                onPress={() => setDiet(d.value)}
              >
                <Text style={[styles.selectBtnText, diet === d.value && styles.selectBtnTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.editBtns}>
            <Button
              title="Cancel"
              onPress={() => setEditing(false)}
              variant="outline"
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <Button
              title="Save & Recalculate"
              onPress={saveProfile}
              loading={saving}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}

      {/* Quick Links */}
      <Card style={styles.linksCard}>
        {[
          { icon: 'pricetag', label: 'Upgrade Plan', screen: 'Pricing', color: Colors.warning },
          { icon: 'logo-whatsapp', label: 'WhatsApp Setup', screen: 'WhatsAppSetup', color: '#25D366' },
          { icon: 'settings', label: 'Settings', screen: 'Settings', color: Colors.textMuted },
        ].map((link) => (
          <TouchableOpacity
            key={link.screen}
            style={styles.linkRow}
            onPress={() => navigation.navigate(link.screen as keyof RootNavigatorParamList)}
          >
            <View style={[styles.linkIcon, { backgroundColor: link.color + '20' }]}>
              <Ionicons name={link.icon as keyof typeof Ionicons.glyphMap} size={20} color={link.color} />
            </View>
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Sign Out */}
      <Button
        title="Sign Out"
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: signOut,
            },
          ]);
        }}
        variant="danger"
        style={styles.signOutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: Spacing.xxl },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarContainer: { marginBottom: Spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: FontWeight.bold },
  profileName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  profileEmail: { color: Colors.textMuted, fontSize: FontSize.md, marginBottom: Spacing.sm },
  profileBadges: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  statUnit: { fontSize: FontSize.sm },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  infoCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  editBtnText: { color: Colors.primary, fontSize: FontSize.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { color: Colors.textMuted, fontSize: FontSize.md },
  infoValue: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  editCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  editCardTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  selectLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  selectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  selectBtn: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  selectBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  selectBtnText: { color: Colors.textMuted, fontSize: FontSize.xs },
  selectBtnTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  editBtns: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  linksCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { color: Colors.text, fontSize: FontSize.md, flex: 1 },
  signOutBtn: { marginHorizontal: Spacing.md },
});
