import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  duration_mins?: number;
  notes?: string;
  created_at: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight_kg?: number;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

const EXERCISE_TEMPLATES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
  'Pull-ups', 'Rows', 'Lunges', 'Plank',
  'Push-ups', 'Bicep Curls', 'Tricep Dips', 'Lat Pulldown',
];

export default function WorkoutScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: 3, reps: 10, weight_kg: undefined },
  ]);

  const fetchLogs = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setLogs((data as WorkoutLog[]) ?? []);
  }, [profile?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      { name: '', sets: 3, reps: 10, weight_kg: undefined },
    ]);
  }

  function removeExercise(idx: number) {
    if (exercises.length <= 1) return;
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateExercise(idx: number, field: keyof Exercise, value: string | number) {
    setExercises((prev) =>
      prev.map((e, i) =>
        i === idx
          ? { ...e, [field]: typeof value === 'string' && field !== 'name' ? parseFloat(value) || 0 : value }
          : e
      )
    );
  }

  async function saveWorkout() {
    if (!workoutName.trim()) {
      Alert.alert('Missing', 'Enter workout name');
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Missing', 'Add at least one exercise');
      return;
    }
    if (!profile?.id) return;
    setSaving(true);
    try {
      await supabase.from('workout_logs').insert({
        user_id: profile.id,
        date: todayISO(),
        name: workoutName,
        exercises: validExercises,
        duration_mins: duration ? parseInt(duration) : null,
        notes: notes.trim() || null,
      });
      setModalVisible(false);
      setWorkoutName('');
      setDuration('');
      setNotes('');
      setExercises([{ name: '', sets: 3, reps: 10, weight_kg: undefined }]);
      await fetchLogs();
    } catch {
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Workout Log</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <LinearGradient colors={['#22c55e20', '#06b6d420']} style={styles.hero}>
          <Ionicons name="barbell" size={40} color={Colors.primary} />
          <Text style={styles.heroTitle}>Track Your Workouts</Text>
          <Text style={styles.heroSubtitle}>Log exercises, sets, reps and weights</Text>
          <Button
            title="Log Workout"
            onPress={() => setModalVisible(true)}
            style={{ marginTop: Spacing.md, width: 180 }}
            size="sm"
          />
        </LinearGradient>

        {/* Stats */}
        {logs.length > 0 && (
          <View style={styles.statsRow}>
            {[
              { label: 'Total Workouts', value: `${logs.length}`, color: Colors.primary },
              {
                label: 'This Week',
                value: `${logs.filter((l) => {
                  const diff = (Date.now() - new Date(l.date).getTime()) / (1000 * 60 * 60 * 24);
                  return diff <= 7;
                }).length}`,
                color: Colors.secondary,
              },
            ].map((s) => (
              <Card key={s.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Card>
            ))}
          </View>
        )}

        {/* Logs */}
        <Text style={styles.sectionTitle}>Workout History</Text>
        {logs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No workouts logged yet</Text>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View>
                  <Text style={styles.logName}>{log.name}</Text>
                  <Text style={styles.logDate}>
                    {new Date(log.date).toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {log.duration_mins ? ` • ${log.duration_mins} min` : ''}
                  </Text>
                </View>
                <View style={styles.exerciseCount}>
                  <Text style={styles.exerciseCountText}>
                    {(log.exercises as Exercise[]).length} exercises
                  </Text>
                </View>
              </View>
              <View style={styles.exerciseList}>
                {(log.exercises as Exercise[]).slice(0, 3).map((ex, i) => (
                  <View key={i} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {ex.sets}×{ex.reps}
                      {ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ''}
                    </Text>
                  </View>
                ))}
                {(log.exercises as Exercise[]).length > 3 && (
                  <Text style={styles.moreExercises}>
                    +{(log.exercises as Exercise[]).length - 3} more
                  </Text>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Workout</Text>

              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>Workout Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder="e.g. Push Day, Leg Day"
                  placeholderTextColor={Colors.textDim}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>Duration (mins)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="e.g. 45"
                  placeholderTextColor={Colors.textDim}
                />
              </View>

              <Text style={styles.fieldLabel}>Exercises</Text>
              {exercises.map((ex, idx) => (
                <View key={idx} style={styles.exerciseForm}>
                  <View style={styles.exerciseFormHeader}>
                    <Text style={styles.exerciseFormNum}>#{idx + 1}</Text>
                    {exercises.length > 1 && (
                      <TouchableOpacity onPress={() => removeExercise(idx)}>
                        <Ionicons name="close-circle" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={styles.fieldInput}
                    value={ex.name}
                    onChangeText={(v) => updateExercise(idx, 'name', v)}
                    placeholder="Exercise name"
                    placeholderTextColor={Colors.textDim}
                  />
                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseField}>
                      <Text style={styles.exerciseFieldLabel}>Sets</Text>
                      <TextInput
                        style={styles.exerciseFieldInput}
                        value={String(ex.sets)}
                        onChangeText={(v) => updateExercise(idx, 'sets', v)}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textDim}
                      />
                    </View>
                    <View style={styles.exerciseField}>
                      <Text style={styles.exerciseFieldLabel}>Reps</Text>
                      <TextInput
                        style={styles.exerciseFieldInput}
                        value={String(ex.reps)}
                        onChangeText={(v) => updateExercise(idx, 'reps', v)}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textDim}
                      />
                    </View>
                    <View style={styles.exerciseField}>
                      <Text style={styles.exerciseFieldLabel}>kg</Text>
                      <TextInput
                        style={styles.exerciseFieldInput}
                        value={ex.weight_kg ? String(ex.weight_kg) : ''}
                        onChangeText={(v) => updateExercise(idx, 'weight_kg', v)}
                        keyboardType="decimal-pad"
                        placeholder="opt"
                        placeholderTextColor={Colors.textDim}
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
              </TouchableOpacity>

              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.fieldInput, { height: 60 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="How was the workout?"
                  placeholderTextColor={Colors.textDim}
                  multiline
                />
              </View>

              <View style={styles.modalBtns}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" fullWidth={false} style={{ flex: 1 }} />
                <Button title="Save" onPress={saveWorkout} loading={saving} fullWidth={false} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  hero: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  heroTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  heroSubtitle: { color: Colors.textMuted, fontSize: FontSize.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
  logCard: { marginBottom: Spacing.sm },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  logName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  logDate: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  exerciseCount: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  exerciseCountText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  exerciseList: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseName: { color: Colors.text, fontSize: FontSize.sm },
  exerciseDetail: { color: Colors.textMuted, fontSize: FontSize.sm },
  moreExercises: { color: Colors.textDim, fontSize: FontSize.xs },
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
    maxHeight: '90%',
  },
  modalTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  modalField: { marginBottom: Spacing.md },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  fieldInput: {
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  exerciseForm: {
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  exerciseFormNum: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  exerciseRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  exerciseField: { flex: 1 },
  exerciseFieldLabel: { color: Colors.textDim, fontSize: FontSize.xs, marginBottom: 3 },
  exerciseFieldInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    textAlign: 'center',
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addExerciseBtnText: { color: Colors.primary, fontSize: FontSize.md },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
});
