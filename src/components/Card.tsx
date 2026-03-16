import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export default function Card({ children, style, padding }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padding !== undefined ? { padding } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
