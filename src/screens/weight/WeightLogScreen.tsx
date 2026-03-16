import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { WeightLog } from '@/types';

const { width } = Dimensions.get('window');

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function calcBMI(weight: number, height: number) {
  const h = height / 100;
  return +(weight / (h * h)).toFixed(1);
}

export default function WeightLogScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(30);
    setLogs((data as WeightLog[]) ?? []);
  }, [profile?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function saveWeight() {
    if (!weight || isNaN(parseFloat(weight))) {
      Alert.alert('Error', 'Enter a valid weight');
      return;
    }
    if (!profile?.id) return;
    setSaving(true);
    try {
      const w = parseFloat(weight);
      const bmi = profile.height_cm ? calcBMI(w, profile.height_cm) : undefined;
      await supabase.from('weight_logs').insert({
        user_id: profile.id,
        date: todayISO(),
        weight_kg: w,
        bmi,
        notes: notes.trim() || null,
      });
      setWeight('');
      setNotes('');
      setModalVisible(false);
      await fetchLogs();
    } catch {
      Alert.alert('Error', 'Failed to save weight');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLog(id: string) {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('weight_logs').delete().eq('id', id);
          setLogs((prev) => prev.filter((l) => l.id !== id));
        },
      },
    ]);
  }

  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sortedLogs.slice(-7);
  const chartLabels = last7.map((l) =>
    new Date(l.date).toLocaleDateString('en', { month: 'numeric', day: 'numeric' })
  );
  const chartData = last7.map((l) => l.weight_kg);

  const latestWeight = logs[0]?.weight_kg;
  const previousWeight = logs[1]?.weight_kg;
  const weightChange = latestWeight && previousWeight
    ? (latestWeight - previousWeight).toFixed(1)
    : null;
  const currentBMI = latestWeight && profile?.height_cm
    ? calcBMI(latestWeight, profile.height_cm)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Weight Log</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Stats */}
        <View style={styles.statsRow}>
          {[
            {
              label: 'Current',
              value: latestWeight ? `${latestWeight}` : '--',
              unit: 'kg',
              color: Colors.primary,
            },
            {
              label: 'Change',
              value: weightChange ? (parseFloat(weightChange) > 0 ? `+${weightChange}` : weightChange) : '--',
              unit: 'kg',
              color: weightChange
                ? parseFloat(weightChange) < 0
                  ? Colors.primary
                  : Colors.danger
                : Colors.textMuted,
            },
            {
              label: 'BMI',
              value: currentBMI ? `${currentBMI}` : '--',
              unit: '',
              color: Colors.secondary,
            },
            {
              label: 'Entries',
              value: `${logs.length}`,
              unit: '',
              color: Colors.warning,
            },
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

        {/* Chart */}
        {last7.length >= 2 && (
          <Card style={styles.chartCard} padding={Spacing.md}>
            <Text style={styles.chartTitle}>Weight Trend (last 7)</Text>
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [{ data: chartData, color: () => Colors.primary, strokeWidth: 2 }],
              }}
              width={width - Spacing.md * 2 - Spacing.md * 2}
              height={180}
              chartConfig={{
                backgroundGradientFrom: Colors.bgCard,
                backgroundGradientTo: Colors.bgCard,
                color: (opacity = 1) => `rgba(34,197,94,${opacity})`,
                labelColor: () => Colors.textMuted,
                strokeWidth: 2,
                propsForDots: { r: '5', strokeWidth: '2', stroke: Colors.primary },
                propsForBackgroundLines: { stroke: Colors.border, strokeWidth: 1 },
              }}
              bezier
              style={styles.chart}
              withShadow={false}
              formatYLabel={(v) => `${parseFloat(v).toFixed(0)}`}
            />
          </Card>
        )}

        {/* History */}
        <Text style={styles.sectionTitle}>History</Text>
        {logs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="scale-outline" size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>No weight entries yet</Text>
            <Text style={styles.emptySubText}>Tap + to log your weight</Text>
          </Card>
        ) : (
          logs.map((log, idx) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={styles.logLeft}>
                  {idx === 0 && (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestBadgeText}>Latest</Text>
                    </View>
                  )}
                  <Text style={styles.logWeight}>{log.weight_kg} kg</Text>
                  <Text style={styles.logDate}>
                    {new Date(log.date).toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  {log.notes ? (
                    <Text style={styles.logNotes}>{log.notes}</Text>
                  ) : null}
                </View>
                <View style={styles.logRight}>
                  {log.bmi ? (
                    <View style={styles.bmiChip}>
                      <Text style={styles.bmiChipText}>BMI {log.bmi}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity onPress={() => deleteLog(log.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Input
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 72.5"
              leftIcon={<Ionicons name="scale-outline" size={20} color={Colors.textMuted} />}
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes..."
              leftIcon={<Ionicons name="create-outline" size={20} color={Colors.textMuted} />}
            />
            <View style={styles.modalBtns}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" fullWidth={false} style={{ flex: 1 }} />
              <Button title="Save" onPress={saveWeight} loading={saving} fullWidth={false} style={{ flex: 1 }} />
            </View>
          </View>
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
  addBtn: { padding: Spacing.xs },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  statUnit: { fontSize: FontSize.sm },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  chartCard: { marginBottom: Spacing.md },
  chartTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  chart: { borderRadius: BorderRadius.md, marginLeft: -Spacing.md },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.lg, fontWeight: FontWeight.medium },
  emptySubText: { color: Colors.textDim, fontSize: FontSize.sm },
  logCard: { marginBottom: Spacing.sm },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logLeft: { flex: 1 },
  logRight: { alignItems: 'flex-end', gap: Spacing.sm },
  latestBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  latestBadgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  logWeight: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  logDate: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  logNotes: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 4 },
  bmiChip: {
    backgroundColor: Colors.secondary + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  bmiChipText: { color: Colors.secondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  deleteBtn: { padding: Spacing.xs },
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
  modalBtns: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
});
