import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { RootNavigatorParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootNavigatorParamList>;

const SCAN_OPTIONS = [
  {
    title: 'Meal Scanner',
    subtitle: 'Take a photo of your meal and let AI identify calories & macros',
    icon: 'camera',
    gradient: ['#22c55e', '#16a34a'] as const,
    screen: 'MealScanner' as const,
    badge: 'AI Powered',
  },
  {
    title: 'Barcode Scanner',
    subtitle: 'Scan a product barcode to instantly get nutrition information',
    icon: 'barcode-outline',
    gradient: ['#06b6d4', '#0891b2'] as const,
    screen: 'BarcodeScanner' as const,
    badge: 'Open Food Facts',
  },
];

export default function ScanMenuScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan & Track</Text>
        <Text style={styles.subtitle}>Choose a scanning method</Text>
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={['rgba(34,197,94,0.05)', 'rgba(6,182,212,0.05)']}
          style={styles.heroIcon}
        >
          <Ionicons name="scan-circle" size={80} color={Colors.primary} />
        </LinearGradient>

        <Text style={styles.heroText}>
          Track your nutrition by scanning meals or product barcodes
        </Text>

        {SCAN_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.screen}
            onPress={() => navigation.navigate(opt.screen)}
            activeOpacity={0.85}
            style={styles.optionWrapper}
          >
            <LinearGradient
              colors={opt.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionCard}
            >
              <View style={styles.optionIconWrap}>
                <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={36} color="#fff" />
              </View>
              <View style={styles.optionInfo}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{opt.badge}</Text>
                  </View>
                </View>
                <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for best results</Text>
          {[
            '📸 Good lighting improves AI accuracy',
            '🎯 Keep food centered in the frame',
            '📦 Ensure barcode is clear and unobstructed',
          ].map((tip) => (
            <Text key={tip} style={styles.tipText}>{tip}</Text>
          ))}
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  heroText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  optionWrapper: { width: '100%', marginBottom: Spacing.md },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  optionIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: { flex: 1 },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  optionTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.semibold },
  optionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  tipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
});
