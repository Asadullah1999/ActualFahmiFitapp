import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { SleepLog } from '@/types';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function calcDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(1));
}

const QUALITY_LABELS = ['', 'Very Poor', 'Poor', 'Okay', 'Good', 'Excellent'];
const QUALITY_COLORS = ['', Colors.danger, Colors.warning, '#f59e0b', Colors.secondary, Colors.primary];

const SLEEP_TIPS = [
  '🌙 Maintain a consistent sleep schedule',
  '📱 Avoid screens 1 hour before bed',
  '🌡️ Keep room cool (65-68°F / 18-20°C)',
  '☕ Avoid caffeine after 2pm',
  '🧘 Try deep breathing or meditation',
  '🏋️ Exercise regularly, but not near bedtime',
];

export default function SleepTrackerScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(14);
    setLogs((data as SleepLog[]) ?? []);
  }, [profile?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function saveSleep() {
    if (!bedtime || !wakeTime) {
      Alert.alert('Missing', 'Enter bedtime and wake time');
      return;
    }
    if (!profile?.id) return;
    setSaving(true);
    try {
      const duration = calcDuration(bedtime, wakeTime);
      await supabase.from('sleep_logs').insert({
        user_id: profile.id,
        date: todayISO(),
        bedtime,
        wake_time: wakeTime,
        duration_hours: duration,
        quality,
        notes: notes.trim() || null,
      });
      setModalVisible(false);
      setNotes('');
      await fetchLogs();
    } catch {
      Alert.alert('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const avgSleep = logs.length
    ? (logs.reduce((s, l) => s + l.duration_hours, 0) / logs.length).toFixed(1)
    : '0';
  const avgQuality = logs.length
    ? (logs.reduce((s, l) => s + l.quality, 0) / logs.length).toFixed(1)
    : '0';
  const latestLog = logs[0];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Sleep Tracker</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Avg Sleep', value: `${avgSleep}h`, color: Colors.accent },
            { label: 'Avg Quality', value: `${avgQuality}/5`, color: Colors.warning },
            { label: 'Entries', value: `${logs.length}`, color: Colors.secondary },
            {
              label: 'Last Night',
              value: latestLog ? `${latestLog.duration_hours}h` : '--',
              color: Colors.primary,
            },
          ].map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Sleep Quality Guide */}
        {latestLog && (
          <Card style={styles.latestCard}>
            <Text style={styles.cardTitle}>Last Night</Text>
            <View style={styles.latestRow}>
              <View style={styles.latestItem}>
                <Ionicons name="moon" size={20} color={Colors.accent} />
                <Text style={styles.latestLabel}>Bedtime</Text>
                <Text style={styles.latestValue}>{latestLog.bedtime}</Text>
              </View>
              <View style={styles.latestArrow}>
                <Ionicons name="arrow-forward" size={16} color={Colors.textDim} />
              </View>
              <View style={styles.latestItem}>
                <Ionicons name="sunny" size={20} color={Colors.warning} />
                <Text style={styles.latestLabel}>Wake</Text>
                <Text style={styles.latestValue}>{latestLog.wake_time}</Text>
              </View>
              <View style={styles.latestDivider} />
              <View style={styles.latestItem}>
                <Ionicons name="time" size={20} color={Colors.primary} />
                <Text style={styles.latestLabel}>Duration</Text>
                <Text style={styles.latestValue}>{latestLog.duration_hours}h</Text>
              </View>
              <View style={styles.latestItem}>
                <Text style={{ fontSize: 20 }}>⭐</Text>
                <Text style={styles.latestLabel}>Quality</Text>
                <Text style={[styles.latestValue, { color: QUALITY_COLORS[latestLog.quality] }]}>
                  {QUALITY_LABELS[latestLog.quality]}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Sleep Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.cardTitle}>Sleep Tips</Text>
          {SLEEP_TIPS.map((tip) => (
            <Text key={tip} style={styles.tip}>{tip}</Text>
          ))}
        </Card>

        {/* History */}
        <Text style={styles.sectionTitle}>Sleep History</Text>
        {logs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="bed-outline" size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>No sleep logs yet</Text>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logRow}>
                <View>
                  <Text style={styles.logDate}>
                    {new Date(log.date).toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.logTime}>
                    {log.bedtime} → {log.wake_time}
                  </Text>
                </View>
                <View style={styles.logRight}>
                  <Text style={styles.logDuration}>{log.duration_hours}h</Text>
                  <View style={[styles.qualityDot, { backgroundColor: QUALITY_COLORS[log.quality] }]} />
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
            <Text style={styles.modalTitle}>Log Sleep</Text>

            <Input
              label="Bedtime (HH:MM)"
              value={bedtime}
              onChangeText={setBedtime}
              placeholder="22:30"
              keyboardType="numbers-and-punctuation"
              leftIcon={<Ionicons name="moon-outline" size={20} color={Colors.textMuted} />}
            />
            <Input
              label="Wake Time (HH:MM)"
              value={wakeTime}
              onChangeText={setWakeTime}
              placeholder="06:30"
              keyboardType="numbers-and-punctuation"
              leftIcon={<Ionicons name="sunny-outline" size={20} color={Colors.textMuted} />}
            />

            {bedtime && wakeTime && (
              <View style={styles.durationPreview}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                <Text style={styles.durationText}>
                  Duration: {calcDuration(bedtime, wakeTime)} hours
                </Text>
              </View>
            )}

            <Text style={styles.qualityLabel}>Sleep Quality</Text>
            <View style={styles.qualityRow}>
              {[1, 2, 3, 4, 5].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityBtn, quality === q && { borderColor: QUALITY_COLORS[q] }]}
                  onPress={() => setQuality(q)}
                >
                  <Text style={[styles.qualityBtnText, quality === q && { color: QUALITY_COLORS[q] }]}>
                    {q}
                  </Text>
                  <Text style={styles.qualityBtnLabel}>{QUALITY_LABELS[q]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="How did you sleep?"
              leftIcon={<Ionicons name="create-outline" size={20} color={Colors.textMuted} />}
            />

            <View style={styles.modalBtns}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" fullWidth={false} style={{ flex: 1 }} />
              <Button title="Save" onPress={saveSleep} loading={saving} fullWidth={false} style={{ flex: 1 }} />
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
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  latestCard: { marginBottom: Spacing.md },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  latestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  latestItem: { alignItems: 'center', gap: 4 },
  latestArrow: { paddingHorizontal: 4 },
  latestDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  latestLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  latestValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tipsCard: { marginBottom: Spacing.md },
  tip: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.lg },
  logCard: { marginBottom: Spacing.sm },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logDate: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  logTime: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  logRight: { alignItems: 'flex-end', gap: Spacing.xs },
  logDuration: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  qualityDot: { width: 10, height: 10, borderRadius: 5 },
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
  durationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  durationText: { color: Colors.primary, fontSize: FontSize.sm },
  qualityLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  qualityRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  qualityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  qualityBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  qualityBtnLabel: { color: Colors.textDim, fontSize: 9, marginTop: 1 },
  modalBtns: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
});
