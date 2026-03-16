import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { DailyLog, RootNavigatorParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootNavigatorParamList>;

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - Spacing.md * 2 - 2;

interface DayData {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const chartConfig = {
  backgroundGradientFrom: Colors.bgCard,
  backgroundGradientTo: Colors.bgCard,
  color: (opacity = 1) => `rgba(34,197,94,${opacity})`,
  labelColor: () => Colors.textMuted,
  strokeWidth: 2,
  barPercentage: 0.6,
  propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
  propsForBackgroundLines: { strokeDasharray: '', stroke: Colors.border, strokeWidth: 1 },
};

export default function ProgressScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [activeChart, setActiveChart] = useState<'calories' | 'macros' | 'water'>('calories');
  const [loading, setLoading] = useState(true);

  const fetchWeekData = useCallback(async () => {
    if (!profile?.id) return;
    const days = getLast7Days();
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', profile.id)
      .gte('date', days[0])
      .lte('date', days[6]);

    const logs = (data as DailyLog[]) ?? [];
    const dayDataArr: DayData[] = days.map((date) => {
      const dayLogs = logs.filter((l) => l.date === date);
      const nonWater = dayLogs.filter((l) => l.food_name !== '__water__');
      const waterLogs = dayLogs.filter((l) => l.food_name === '__water__');
      const d = new Date(date);
      return {
        date,
        label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3),
        calories: nonWater.reduce((s, l) => s + l.calories, 0),
        protein: nonWater.reduce((s, l) => s + l.protein_g, 0),
        carbs: nonWater.reduce((s, l) => s + l.carbs_g, 0),
        fat: nonWater.reduce((s, l) => s + l.fat_g, 0),
        water: waterLogs.reduce((s, l) => s + l.calories, 0) / 1000,
      };
    });
    setWeekData(dayDataArr);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  const labels = weekData.map((d) => d.label);

  const avgCalories = weekData.length
    ? Math.round(weekData.reduce((s, d) => s + d.calories, 0) / weekData.length)
    : 0;
  const avgProtein = weekData.length
    ? Math.round(weekData.reduce((s, d) => s + d.protein, 0) / weekData.length)
    : 0;
  const avgWater = weekData.length
    ? (weekData.reduce((s, d) => s + d.water, 0) / weekData.length).toFixed(1)
    : '0';
  const daysLogged = weekData.filter((d) => d.calories > 0).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Last 7 days overview</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Avg Calories', value: `${avgCalories}`, unit: 'kcal', color: Colors.primary },
          { label: 'Avg Protein', value: `${avgProtein}`, unit: 'g', color: Colors.secondary },
          { label: 'Avg Water', value: avgWater, unit: 'L', color: Colors.accent },
          { label: 'Days Logged', value: `${daysLogged}`, unit: '/7', color: Colors.warning },
        ].map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
              <Text style={styles.statUnit}>{stat.unit}</Text>
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      {/* Chart Selector */}
      <View style={styles.chartTabs}>
        {(['calories', 'macros', 'water'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.chartTab, activeChart === tab && styles.chartTabActive]}
            onPress={() => setActiveChart(tab)}
          >
            <Text
              style={[
                styles.chartTabText,
                activeChart === tab && styles.chartTabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Charts */}
      {!loading && weekData.length > 0 && (
        <Card style={styles.chartCard} padding={Spacing.md}>
          {activeChart === 'calories' && (
            <>
              <Text style={styles.chartTitle}>Daily Calories</Text>
              <LineChart
                data={{
                  labels,
                  datasets: [
                    {
                      data: weekData.map((d) => d.calories || 0),
                      color: () => Colors.primary,
                      strokeWidth: 2,
                    },
                    {
                      data: Array(7).fill(profile?.daily_calories ?? 2000),
                      color: () => 'rgba(245,158,11,0.5)',
                      strokeWidth: 1,
                    },
                  ],
                  legend: ['Actual', 'Target'],
                }}
                width={CHART_WIDTH - Spacing.md * 2}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withDots
                withShadow={false}
              />
            </>
          )}

          {activeChart === 'macros' && (
            <>
              <Text style={styles.chartTitle}>Daily Macros (g)</Text>
              <BarChart
                data={{
                  labels,
                  datasets: [
                    { data: weekData.map((d) => d.protein || 0) },
                  ],
                }}
                width={CHART_WIDTH - Spacing.md * 2}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: () => Colors.secondary,
                }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix="g"
                showValuesOnTopOfBars
              />
              <View style={styles.macroLegend}>
                {[
                  { label: 'Protein', color: Colors.secondary },
                  { label: 'Carbs', color: Colors.warning },
                  { label: 'Fat', color: Colors.accent },
                ].map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeChart === 'water' && (
            <>
              <Text style={styles.chartTitle}>Daily Water (L)</Text>
              <BarChart
                data={{
                  labels,
                  datasets: [{ data: weekData.map((d) => d.water || 0) }],
                }}
                width={CHART_WIDTH - Spacing.md * 2}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: () => Colors.secondary,
                }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix="L"
              />
              <View style={styles.waterTarget}>
                <Ionicons name="water" size={16} color={Colors.secondary} />
                <Text style={styles.waterTargetText}>Daily target: 2.5L</Text>
              </View>
            </>
          )}
        </Card>
      )}

      {/* 7-Day History */}
      <Text style={styles.sectionTitle}>7-Day History</Text>
      {weekData.map((day) => (
        <Card key={day.date} style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyDate}>
                {new Date(day.date).toLocaleDateString('en', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              {day.calories === 0 && (
                <Text style={styles.noLog}>No meals logged</Text>
              )}
            </View>
            {day.calories > 0 && (
              <Text style={styles.historyCals}>{day.calories} kcal</Text>
            )}
          </View>
          {day.calories > 0 && (
            <View style={styles.historyMacros}>
              {[
                { label: 'P', val: day.protein, color: Colors.secondary },
                { label: 'C', val: day.carbs, color: Colors.warning },
                { label: 'F', val: day.fat, color: Colors.accent },
                { label: 'W', val: `${day.water}L`, color: Colors.secondary },
              ].map((m) => (
                <View key={m.label} style={styles.historyMacro}>
                  <Text style={[styles.macroLabel, { color: m.color }]}>{m.label}</Text>
                  <Text style={styles.macroValue}>{m.val}{typeof m.val === 'number' ? 'g' : ''}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      ))}

      {/* Quick Links */}
      <Text style={styles.sectionTitle}>Track More</Text>
      <View style={styles.quickLinks}>
        {[
          { icon: 'scale', label: 'Weight Log', screen: 'WeightLog', color: Colors.primary },
          { icon: 'bed', label: 'Sleep', screen: 'SleepTracker', color: Colors.accent },
          { icon: 'barbell', label: 'Workout', screen: 'Workout', color: Colors.secondary },
        ].map((link) => (
          <TouchableOpacity
            key={link.screen}
            style={styles.quickLink}
            onPress={() => navigation.navigate(link.screen as keyof RootNavigatorParamList)}
          >
            <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '20' }]}>
              <Ionicons name={link.icon as keyof typeof Ionicons.glyphMap} size={22} color={link.color} />
            </View>
            <Text style={styles.quickLinkLabel}>{link.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: Spacing.xxl },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.md, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  statUnit: { fontSize: FontSize.sm, fontWeight: FontWeight.regular },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  chartTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  chartTabActive: { backgroundColor: Colors.primary + '20' },
  chartTabText: { color: Colors.textMuted, fontSize: FontSize.sm },
  chartTabTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  chartCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  chartTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  chart: { borderRadius: BorderRadius.md, marginLeft: -Spacing.md },
  macroLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  waterTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    justifyContent: 'center',
  },
  waterTargetText: { color: Colors.textMuted, fontSize: FontSize.sm },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyDate: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  noLog: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 2 },
  historyCals: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  historyMacros: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyMacro: { alignItems: 'center' },
  macroLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  macroValue: { color: Colors.text, fontSize: FontSize.sm },
  quickLinks: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  quickLinkIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
});
