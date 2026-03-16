import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '@/constants/theme';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'warning' | 'danger' | 'muted' | 'success';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  small?: boolean;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: 'rgba(34,197,94,0.15)', text: Colors.primary },
  secondary: { bg: 'rgba(6,182,212,0.15)', text: Colors.secondary },
  accent: { bg: 'rgba(139,92,246,0.15)', text: Colors.accent },
  warning: { bg: 'rgba(245,158,11,0.15)', text: Colors.warning },
  danger: { bg: 'rgba(239,68,68,0.15)', text: Colors.danger },
  muted: { bg: 'rgba(148,163,184,0.1)', text: Colors.textMuted },
  success: { bg: 'rgba(34,197,94,0.15)', text: Colors.primary },
};

export default function Badge({ label, variant = 'primary', style, small }: BadgeProps) {
  const { bg, text } = variantColors[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        small && styles.small,
        style,
      ]}
    >
      <Text style={[styles.text, { color: text }, small && styles.smallText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs - 1,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  smallText: {
    fontSize: FontSize.xs,
  },
});
