import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { MealType, Mood, DailyLog } from '@/types';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'great', label: 'Great', emoji: '😁' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'bad', label: 'Bad', emoji: '😞' },
];

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
];

const QUICK_FOODS = [
  { name: 'Idli (2 pcs)', calories: 140, protein_g: 4, carbs_g: 28, fat_g: 1 },
  { name: 'Dosa (1 pcs)', calories: 180, protein_g: 4, carbs_g: 33, fat_g: 4 },
  { name: 'Sambar (1 bowl)', calories: 110, protein_g: 6, carbs_g: 18, fat_g: 2 },
  { name: 'Rice (1 cup)', calories: 206, protein_g: 4, carbs_g: 45, fat_g: 0 },
  { name: 'Chapati (1 pcs)', calories: 120, protein_g: 3, carbs_g: 22, fat_g: 3 },
  { name: 'Dal (1 bowl)', calories: 150, protein_g: 9, carbs_g: 24, fat_g: 2 },
  { name: 'Curd (100g)', calories: 61, protein_g: 3, carbs_g: 5, fat_g: 3 },
  { name: 'Egg Boiled', calories: 78, protein_g: 6, carbs_g: 1, fat_g: 5 },
  { name: 'Banana', calories: 89, protein_g: 1, carbs_g: 23, fat_g: 0 },
  { name: 'Chicken (100g)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 4 },
  { name: 'Upma (1 bowl)', calories: 200, protein_g: 5, carbs_g: 38, fat_g: 4 },
  { name: 'Poha (1 bowl)', calories: 250, protein_g: 5, carbs_g: 50, fat_g: 4 },
];

interface FoodEntry {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export default function MealCheckinScreen() {
  const { profile } = useAuth();
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [mood, setMood] = useState<Mood>('good');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [customFood, setCustomFood] = useState<FoodEntry>({
    name: '',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', todayISO())
      .neq('food_name', '__water__')
      .order('created_at', { ascending: false });
    setLogs((data as DailyLog[]) ?? []);
  }, [profile?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function addFood(food: FoodEntry) {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await supabase.from('daily_logs').insert({
        user_id: profile.id,
        date: todayISO(),
        meal_type: selectedMeal,
        food_name: food.name,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        mood,
      });
      await fetchLogs();
    } catch (err) {
      Alert.alert('Error', 'Failed to log food');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLog(id: string) {
    await supabase.from('daily_logs').delete().eq('id', id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  async function saveCustomFood() {
    if (!customFood.name.trim()) {
      Alert.alert('Missing', 'Enter food name');
      return;
    }
    await addFood(customFood);
    setCustomFood({ name: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
    setModalVisible(false);
  }

  const mealLogs = logs.filter((l) => l.meal_type === selectedMeal);
  const mealCals = mealLogs.reduce((s, l) => s + l.calories, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Check-in</Text>
        <Text style={styles.subtitle}>Log what you ate today</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Meal Type Selector */}
        <View style={styles.mealTabs}>
          {MEAL_TYPES.map((mt) => (
            <TouchableOpacity
              key={mt.value}
              style={[styles.mealTab, selectedMeal === mt.value && styles.mealTabActive]}
              onPress={() => setSelectedMeal(mt.value)}
            >
              <Text style={styles.mealTabEmoji}>{mt.icon}</Text>
              <Text
                style={[
                  styles.mealTabLabel,
                  selectedMeal === mt.value && styles.mealTabLabelActive,
                ]}
              >
                {mt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mood Tracker */}
        <Card style={styles.moodCard}>
          <Text style={styles.cardTitle}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.moodBtn, mood === m.value && styles.moodBtnActive]}
                onPress={() => setMood(m.value)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Current Meal Logs */}
        {mealLogs.length > 0 && (
          <Card style={styles.loggedCard}>
            <View style={styles.loggedHeader}>
              <Text style={styles.cardTitle}>
                {MEAL_TYPES.find((m) => m.value === selectedMeal)?.label} — {mealCals} kcal
              </Text>
            </View>
            {mealLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View>
                  <Text style={styles.logName}>{log.food_name}</Text>
                  <Text style={styles.logMacros}>
                    {log.calories} kcal · P{log.protein_g}g · C{log.carbs_g}g · F{log.fat_g}g
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteLog(log.id)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}

        {/* Quick Food Library */}
        <Text style={styles.sectionTitle}>Quick Add — South Indian Foods</Text>
        <View style={styles.quickFoods}>
          {QUICK_FOODS.map((food) => (
            <TouchableOpacity
              key={food.name}
              style={styles.quickFood}
              onPress={() => addFood(food)}
              disabled={saving}
            >
              <View style={styles.quickFoodInfo}>
                <Text style={styles.quickFoodName}>{food.name}</Text>
                <Text style={styles.quickFoodCals}>{food.calories} kcal</Text>
              </View>
              <Ionicons name="add-circle" size={22} color={Colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="+ Add Custom Food"
          onPress={() => setModalVisible(true)}
          variant="outline"
          style={styles.customBtn}
        />
      </ScrollView>

      {/* Custom Food Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Food</Text>

            {[
              { label: 'Food Name', key: 'name', keyboard: 'default' },
              { label: 'Calories (kcal)', key: 'calories', keyboard: 'numeric' },
              { label: 'Protein (g)', key: 'protein_g', keyboard: 'numeric' },
              { label: 'Carbs (g)', key: 'carbs_g', keyboard: 'numeric' },
              { label: 'Fat (g)', key: 'fat_g', keyboard: 'numeric' },
            ].map((field) => (
              <View key={field.key} style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={String(customFood[field.key as keyof FoodEntry] || '')}
                  onChangeText={(v) =>
                    setCustomFood((prev) => ({
                      ...prev,
                      [field.key]:
                        field.key === 'name' ? v : parseFloat(v) || 0,
                    }))
                  }
                  keyboardType={field.keyboard as 'default' | 'numeric'}
                  placeholderTextColor={Colors.textDim}
                  placeholder={field.key === 'name' ? 'e.g. Grilled Chicken' : '0'}
                />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                fullWidth={false}
                style={{ width: 110 }}
              />
              <Button
                title="Add Food"
                onPress={saveCustomFood}
                loading={saving}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
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
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  mealTabs: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  mealTabActive: {
    backgroundColor: Colors.primary + '20',
  },
  mealTabEmoji: { fontSize: 16 },
  mealTabLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  mealTabLabelActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  moodCard: { marginBottom: Spacing.md },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCardAlt,
    flex: 1,
    marginHorizontal: 2,
  },
  moodBtnActive: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  moodEmoji: { fontSize: 22, marginBottom: 4 },
  moodLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  moodLabelActive: { color: Colors.primary },
  loggedCard: { marginBottom: Spacing.md },
  loggedHeader: { marginBottom: Spacing.sm },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logName: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  logMacros: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  quickFoods: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  quickFood: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickFoodInfo: {},
  quickFoodName: { color: Colors.text, fontSize: FontSize.md },
  quickFoodCals: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  customBtn: { marginBottom: Spacing.xl },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  modalField: { marginBottom: Spacing.md },
  modalFieldLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
