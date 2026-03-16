import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const navigation = useNavigation();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          type: 'toggle' as const,
          icon: 'notifications',
          label: 'Push Notifications',
          value: pushNotifications,
          onChange: setPushNotifications,
          color: Colors.primary,
        },
        {
          type: 'toggle' as const,
          icon: 'mail',
          label: 'Email Updates',
          value: emailUpdates,
          onChange: setEmailUpdates,
          color: Colors.secondary,
        },
        {
          type: 'toggle' as const,
          icon: 'document-text',
          label: 'Weekly Progress Report',
          value: weeklyReport,
          onChange: setWeeklyReport,
          color: Colors.accent,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          type: 'nav' as const,
          icon: 'person',
          label: 'Edit Profile',
          onPress: () => navigation.goBack(),
          color: Colors.primary,
        },
        {
          type: 'nav' as const,
          icon: 'pricetag',
          label: 'Subscription & Billing',
          onPress: () => navigation.navigate('Pricing' as never),
          color: Colors.warning,
        },
        {
          type: 'nav' as const,
          icon: 'logo-whatsapp',
          label: 'WhatsApp Setup',
          onPress: () => navigation.navigate('WhatsAppSetup' as never),
          color: '#25D366',
        },
        {
          type: 'nav' as const,
          icon: 'alarm',
          label: 'Reminders',
          onPress: () => navigation.navigate('Reminders' as never),
          color: Colors.secondary,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          type: 'nav' as const,
          icon: 'help-circle',
          label: 'Help & FAQ',
          onPress: () => {},
          color: Colors.textMuted,
        },
        {
          type: 'nav' as const,
          icon: 'star',
          label: 'Rate the App',
          onPress: () => {},
          color: Colors.warning,
        },
        {
          type: 'nav' as const,
          icon: 'share-social',
          label: 'Share FahmiFit',
          onPress: () => {},
          color: Colors.primary,
        },
        {
          type: 'nav' as const,
          icon: 'shield-checkmark',
          label: 'Privacy Policy',
          onPress: () => {},
          color: Colors.textMuted,
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          type: 'nav' as const,
          icon: 'trash',
          label: 'Delete Account',
          onPress: () => {
            Alert.alert(
              'Delete Account',
              'This will permanently delete all your data. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => Alert.alert('Contact Support', 'Please email support@fahmifit.com to delete your account.'),
                },
              ]
            );
          },
          color: Colors.danger,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Summary */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(profile?.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
            </View>
          </View>
        </Card>

        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard} padding={0}>
              {section.items.map((item, idx) => (
                <View
                  key={item.label}
                  style={[
                    styles.settingRow,
                    idx < section.items.length - 1 && styles.settingRowBorder,
                  ]}
                >
                  <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onChange}
                      trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                      thumbColor={item.value ? Colors.primary : Colors.textDim}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.navArrow}
                      onPress={item.onPress}
                    >
                      <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>FahmiFit v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 FahmiFit. All rights reserved.</Text>
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => {
            Alert.alert('Sign Out', 'Sign out of FahmiFit?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  profileCard: { marginBottom: Spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  profileInfo: { flex: 1 },
  profileName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  profileEmail: { color: Colors.textMuted, fontSize: FontSize.sm },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { color: Colors.text, fontSize: FontSize.md, flex: 1 },
  navArrow: { padding: Spacing.xs },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.lg, gap: 4 },
  appVersion: { color: Colors.textDim, fontSize: FontSize.sm },
  appCopyright: { color: Colors.textDim, fontSize: FontSize.xs },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger + '15',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
  },
  signOutText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
