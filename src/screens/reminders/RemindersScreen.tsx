import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { Reminder, ReminderChannel } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const REMINDER_TYPES = [
  { value: 'meal', label: 'Meal Reminder', icon: '🍽️' },
  { value: 'water', label: 'Water Reminder', icon: '💧' },
  { value: 'weigh_in', label: 'Weigh-In', icon: '⚖️' },
  { value: 'custom', label: 'Custom', icon: '🔔' },
];

const CHANNELS: { value: ReminderChannel; label: string; icon: string }[] = [
  { value: 'push', label: 'Push Notification', icon: '📱' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'both', label: 'Both', icon: '🔔' },
];

export default function RemindersScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'meal' | 'water' | 'weigh_in' | 'custom'>('meal');
  const [time, setTime] = useState('08:00');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [channel, setChannel] = useState<ReminderChannel>('push');

  const fetchReminders = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setReminders((data as Reminder[]) ?? []);
  }, [profile?.id]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function saveReminder() {
    if (!title.trim()) {
      const defaultTitle = REMINDER_TYPES.find((t) => t.value === type)?.label ?? 'Reminder';
      setTitle(defaultTitle);
    }
    if (!profile?.id) return;
    if (days.length === 0) {
      Alert.alert('Select Days', 'Choose at least one day');
      return;
    }
    setSaving(true);
    try {
      await supabase.from('reminders').insert({
        user_id: profile.id,
        title: title.trim() || REMINDER_TYPES.find((t) => t.value === type)?.label,
        type,
        time,
        days,
        channel,
        active: true,
      });
      setModalVisible(false);
      setTitle('');
      setType('meal');
      setTime('08:00');
      setDays([1, 2, 3, 4, 5]);
      setChannel('push');
      await fetchReminders();
    } catch {
      Alert.alert('Error', 'Failed to save reminder');
    } finally {
      setSaving(false);
    }
  }

  async function toggleReminder(id: string, active: boolean) {
    await supabase.from('reminders').update({ active }).eq('id', id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active } : r))
    );
  }

  async function deleteReminder(id: string) {
    Alert.alert('Delete', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('reminders').delete().eq('id', id);
          setReminders((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  }

  const typeIcon = (t: string) =>
    REMINDER_TYPES.find((rt) => rt.value === t)?.icon ?? '🔔';

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Reminders</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {reminders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptyText}>
              Set up meal, water, or custom reminders to stay on track
            </Text>
            <Button
              title="Create Reminder"
              onPress={() => setModalVisible(true)}
              style={{ marginTop: Spacing.lg, width: 200 }}
            />
          </View>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} style={styles.reminderCard}>
              <View style={styles.reminderRow}>
                <View style={styles.reminderIcon}>
                  <Text style={{ fontSize: 22 }}>{typeIcon(reminder.type)}</Text>
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderTime}>{reminder.time}</Text>
                  <View style={styles.reminderMeta}>
                    <View style={styles.reminderDays}>
                      {DAYS.map((d, i) => (
                        <View
                          key={d}
                          style={[
                            styles.dayDot,
                            reminder.days.includes(i) && styles.dayDotActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayDotText,
                              reminder.days.includes(i) && styles.dayDotTextActive,
                            ]}
                          >
                            {d[0]}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.channelBadge}>
                      <Text style={styles.channelText}>
                        {CHANNELS.find((c) => c.value === reminder.channel)?.icon} {reminder.channel}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reminderActions}>
                  <Switch
                    value={reminder.active}
                    onValueChange={(v) => toggleReminder(reminder.id, v)}
                    trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                    thumbColor={reminder.active ? Colors.primary : Colors.textDim}
                  />
                  <TouchableOpacity onPress={() => deleteReminder(reminder.id)}>
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
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Reminder</Text>

              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeGrid}>
                {REMINDER_TYPES.map((rt) => (
                  <TouchableOpacity
                    key={rt.value}
                    style={[styles.typeBtn, type === rt.value && styles.typeBtnActive]}
                    onPress={() => {
                      setType(rt.value as typeof type);
                      setTitle(rt.label);
                    }}
                  >
                    <Text style={styles.typeIcon}>{rt.icon}</Text>
                    <Text style={[styles.typeLabel, type === rt.value && styles.typeLabelActive]}>
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Reminder title"
                leftIcon={<Ionicons name="text-outline" size={20} color={Colors.textMuted} />}
              />

              <Input
                label="Time (HH:MM)"
                value={time}
                onChangeText={setTime}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
                leftIcon={<Ionicons name="time-outline" size={20} color={Colors.textMuted} />}
              />

              <Text style={styles.fieldLabel}>Days</Text>
              <View style={styles.daysRow}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayBtn, days.includes(i) && styles.dayBtnActive]}
                    onPress={() => toggleDay(i)}
                  >
                    <Text style={[styles.dayBtnText, days.includes(i) && styles.dayBtnTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Notification Channel</Text>
              <View style={styles.channelList}>
                {CHANNELS.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.channelBtn, channel === c.value && styles.channelBtnActive]}
                    onPress={() => setChannel(c.value)}
                  >
                    <Text style={styles.channelBtnIcon}>{c.icon}</Text>
                    <Text
                      style={[
                        styles.channelBtnText,
                        channel === c.value && styles.channelBtnTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                    {channel === c.value && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <Button
                  title="Cancel"
                  onPress={() => setModalVisible(false)}
                  variant="outline"
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save"
                  onPress={saveReminder}
                  loading={saving}
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
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
  addBtn: { padding: Spacing.xs },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  reminderCard: { marginBottom: Spacing.sm },
  reminderRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  reminderIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderInfo: { flex: 1 },
  reminderTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  reminderTime: { color: Colors.primary, fontSize: FontSize.sm, marginTop: 2 },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  reminderDays: { flexDirection: 'row', gap: 3 },
  dayDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotActive: { backgroundColor: Colors.primary + '30' },
  dayDotText: { fontSize: 9, color: Colors.textDim },
  dayDotTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  channelBadge: {
    backgroundColor: Colors.bgCardAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  channelText: { color: Colors.textMuted, fontSize: FontSize.xs },
  reminderActions: { alignItems: 'center', gap: Spacing.sm },
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
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeBtn: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  typeIcon: { fontSize: 18 },
  typeLabel: { color: Colors.textMuted, fontSize: FontSize.sm, flex: 1 },
  typeLabelActive: { color: Colors.primary, fontWeight: FontWeight.medium },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dayBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  dayBtnText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  dayBtnTextActive: { color: Colors.primary },
  channelList: { gap: Spacing.xs, marginBottom: Spacing.lg },
  channelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  channelBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  channelBtnIcon: { fontSize: 20 },
  channelBtnText: { color: Colors.textMuted, fontSize: FontSize.md, flex: 1 },
  channelBtnTextActive: { color: Colors.primary, fontWeight: FontWeight.medium },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
});
