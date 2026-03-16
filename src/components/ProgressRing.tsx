import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  size,
  strokeWidth,
  progress,
  color = Colors.primary,
  trackColor = Colors.border,
  label,
  sublabel,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children ?? (
        <View style={styles.center}>
          {label ? (
            <Text style={[styles.label, { color }]}>{label}</Text>
          ) : null}
          {sublabel ? (
            <Text style={styles.sublabel}>{sublabel}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  sublabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
