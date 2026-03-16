import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ProgressRing from '@/components/ProgressRing';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { DailyLog, RootNavigatorParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootNavigatorParamList>;

const { width } = Dimensions.get('window');

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function greetingTime() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function calcBMI(weight: number, height: number) {
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', variant: 'warning' as const };
  if (bmi < 25) return { label: 'Normal', variant: 'primary' as const };
  if (bmi < 30) return { label: 'Overweight', variant: 'warning' as const };
  return { label: 'Obese', variant: 'danger' as const };
}

const QUICK_ACTIONS = [
  { icon: 'chatbubble-ellipses', label: 'AI Chat', screen: 'AIChat', color: Colors.accent },
  { icon: 'barbell', label: 'Workout', screen: 'Workout', color: Colors.secondary },
  { icon: 'bed', label: 'Sleep', screen: 'SleepTracker', color: Colors.warning },
  { icon: 'cart', label: 'Grocery', screen: 'GroceryList', color: Colors.primary },
  { icon: 'logo-whatsapp', label: 'WhatsApp', screen: 'WhatsAppSetup', color: '#25D366' },
  { icon: 'pricetag', label: 'Upgrade', screen: 'Pricing', color: Colors.warning },
  { icon: 'alarm', label: 'Reminders', screen: 'Reminders', color: Colors.secondary },
  { icon: 'settings', label: 'Settings', screen: 'Settings', color: Colors.textMuted },
];

export default function DashboardScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    const today = todayISO();

    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today);

    setLogs((data as DailyLog[]) ?? []);

    // fetch water from today's logs (could be separate table; use notes field as proxy)
    const waterTotal = ((data as DailyLog[]) ?? [])
      .filter((l) => l.food_name === '__water__')
      .reduce((sum, l) => sum + l.calories, 0);
    setWaterMl(waterTotal);

    // simple streak: count consecutive days with logs
    const { data: streakData } = await supabase
      .from('daily_logs')
      .select('date')
      .eq('user_id', profile.id)
      .neq('food_name', '__water__')
      .order('date', { ascending: false })
      .limit(30);

    if (streakData && streakData.length > 0) {
      const uniqueDates = [...new Set(streakData.map((l: { date: string }) => l.date))].sort().reverse();
      let s = 0;
      const now = new Date();
      for (const d of uniqueDates) {
        const diff = Math.floor(
          (now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === s) s++;
        else break;
      }
      setStreak(s);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const nonWaterLogs = logs.filter((l) => l.food_name !== '__water__');
  const totalCals = nonWaterLogs.reduce((s, l) => s + l.calories, 0);
  const totalProtein = nonWaterLogs.reduce((s, l) => s + l.protein_g, 0);
  const totalCarbs = nonWaterLogs.reduce((s, l) => s + l.carbs_g, 0);
  const totalFat = nonWaterLogs.reduce((s, l) => s + l.fat_g, 0);

  const targetCals = profile?.daily_calories ?? 2000;
  const targetProtein = profile?.daily_protein ?? 150;
  const targetCarbs = profile?.daily_carbs ?? 225;
  const targetFat = profile?.daily_fat ?? 55;

  const calProgress = Math.min(totalCals / targetCals, 1);
  const waterTarget = 2500;
  const waterProgress = Math.min(waterMl / waterTarget, 1);

  const bmi =
    profile?.weight_kg && profile?.height_cm
      ? parseFloat(calcBMI(profile.weight_kg, profile.height_cm))
      : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  async function logWater(ml: number) {
    if (!profile?.id) return;
    await supabase.from('daily_logs').insert({
      user_id: profile.id,
      date: todayISO(),
      meal_type: 'snack',
      food_name: '__water__',
      calories: ml,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    });
    setWaterMl((w) => w + ml);
  }

  const mealGroups = ['breakfast', 'lunch', 'dinner', 'snack'].map((mt) => ({
    type: mt,
    items: nonWaterLogs.filter((l) => l.meal_type === mt),
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#1a1d27', '#0f1117']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greetingTime()},</Text>
            <Text style={styles.userName}>{profile?.name ?? 'Friend'} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakCount}>{streak}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('Reminders')}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Calorie Ring */}
      <Card style={styles.calorieCard}>
        <View style={styles.calorieRow}>
          <ProgressRing
            size={140}
            strokeWidth={12}
            progress={calProgress}
            color={Colors.primary}
          >
            <View style={styles.ringCenter}>
              <Text style={styles.ringValue}>{totalCals}</Text>
              <Text style={styles.ringLabel}>kcal eaten</Text>
              <Text style={styles.ringRemaining}>
                {Math.max(0, targetCals - totalCals)} left
              </Text>
            </View>
          </ProgressRing>

          <View style={styles.macroList}>
            {[
              { name: 'Protein', val: totalProtein, target: targetProtein, color: Colors.secondary },
              { name: 'Carbs', val: totalCarbs, target: targetCarbs, color: Colors.warning },
              { name: 'Fat', val: totalFat, target: targetFat, color: Colors.accent },
            ].map((m) => (
              <View key={m.name} style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroName}>{m.name}</Text>
                  <Text style={styles.macroVal}>
                    {Math.round(m.val)}/{m.target}g
                  </Text>
                </View>
                <View style={styles.macroTrack}>
                  <View
                    style={[
                      styles.macroFill,
                      {
                        width: `${Math.min((m.val / m.target) * 100, 100)}%`,
                        backgroundColor: m.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* Water Tracker */}
      <Card style={styles.waterCard}>
        <View style={styles.waterHeader}>
          <View style={styles.waterTitleRow}>
            <Ionicons name="water" size={20} color={Colors.secondary} />
            <Text style={styles.waterTitle}>Water Intake</Text>
          </View>
          <Text style={styles.waterAmount}>
            {(waterMl / 1000).toFixed(1)}L / 2.5L
          </Text>
        </View>
        <View style={styles.waterTrack}>
          <View
            style={[styles.waterFill, { width: `${waterProgress * 100}%` }]}
          />
        </View>
        <View style={styles.waterBtns}>
          {[250, 500, 750].map((ml) => (
            <TouchableOpacity
              key={ml}
              style={styles.waterBtn}
              onPress={() => logWater(ml)}
            >
              <Text style={styles.waterBtnText}>+{ml}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.screen}
            style={styles.actionCard}
            onPress={() => navigation.navigate(a.screen as keyof RootNavigatorParamList)}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
              <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={22} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BMI Card */}
      {bmi && bmiInfo && (
        <Card style={styles.bmiCard}>
          <View style={styles.bmiRow}>
            <View>
              <Text style={styles.bmiTitle}>BMI Score</Text>
              <Text style={styles.bmiValue}>{bmi}</Text>
            </View>
            <Badge label={bmiInfo.label} variant={bmiInfo.variant} />
          </View>
          <View style={styles.bmiScale}>
            {[
              { label: '<18.5', color: Colors.secondary },
              { label: '18.5–25', color: Colors.primary },
              { label: '25–30', color: Colors.warning },
              { label: '>30', color: Colors.danger },
            ].map((s) => (
              <View key={s.label} style={styles.bmiScaleItem}>
                <View style={[styles.bmiScaleDot, { backgroundColor: s.color }]} />
                <Text style={styles.bmiScaleLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Today's Meals Summary */}
      <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
      {mealGroups.map((mg) => (
        <Card key={mg.type} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealType}>
              {mg.type.charAt(0).toUpperCase() + mg.type.slice(1)}
            </Text>
            <Text style={styles.mealCals}>
              {mg.items.reduce((s, l) => s + l.calories, 0)} kcal
            </Text>
          </View>
          {mg.items.length === 0 ? (
            <Text style={styles.mealEmpty}>No meals logged</Text>
          ) : (
            mg.items.map((item) => (
              <View key={item.id} style={styles.mealItem}>
                <Text style={styles.mealItemName}>{item.food_name}</Text>
                <Text style={styles.mealItemCals}>{item.calories} kcal</Text>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.addMealBtn}
            onPress={() => navigation.navigate('LogMeal' as keyof RootNavigatorParamList)}
          >
            <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.addMealText}>Add {mg.type}</Text>
          </TouchableOpacity>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: Spacing.xxl },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { color: Colors.textMuted, fontSize: FontSize.md },
  userName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  streakFire: { fontSize: 14 },
  streakCount: {
    color: Colors.warning,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  notifBtn: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  calorieCard: {
    margin: Spacing.md,
    marginTop: Spacing.md,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  ringCenter: { alignItems: 'center' },
  ringValue: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  ringLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  ringRemaining: { color: Colors.primary, fontSize: FontSize.xs, marginTop: 2 },
  macroList: { flex: 1, gap: Spacing.sm + 2 },
  macroItem: {},
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroName: { color: Colors.textMuted, fontSize: FontSize.xs },
  macroVal: { color: Colors.text, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  macroTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  macroFill: {
    height: 6,
    borderRadius: BorderRadius.full,
  },
  waterCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  waterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  waterTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  waterAmount: { color: Colors.secondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  waterTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  waterFill: {
    height: 8,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
  },
  waterBtns: { flexDirection: 'row', gap: Spacing.sm },
  waterBtn: {
    flex: 1,
    backgroundColor: 'rgba(6,182,212,0.12)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
  },
  waterBtnText: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  actionCard: {
    width: (width - Spacing.md * 2 - Spacing.sm * 3) / 4,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  bmiCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bmiTitle: { color: Colors.textMuted, fontSize: FontSize.sm },
  bmiValue: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  bmiScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiScaleItem: { alignItems: 'center', gap: 3 },
  bmiScaleDot: { width: 8, height: 8, borderRadius: 4 },
  bmiScaleLabel: { color: Colors.textDim, fontSize: 10 },
  mealCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  mealType: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  mealCals: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  mealEmpty: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  mealItemName: { color: Colors.text, fontSize: FontSize.sm },
  mealItemCals: { color: Colors.textMuted, fontSize: FontSize.sm },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addMealText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
