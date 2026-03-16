export const Colors = {
  bg: '#0f1117',
  bgCard: '#1a1d27',
  bgCardAlt: '#212435',
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryLight: '#4ade80',
  secondary: '#06b6d4',
  secondaryDark: '#0891b2',
  accent: '#8b5cf6',
  accentDark: '#7c3aed',
  warning: '#f59e0b',
  warningDark: '#d97706',
  danger: '#ef4444',
  dangerDark: '#dc2626',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  border: '#2a2d3a',
  borderLight: '#3a3d4a',
  overlay: 'rgba(0,0,0,0.6)',
};

export const Gradients = {
  primary: ['#22c55e', '#16a34a'] as const,
  secondary: ['#06b6d4', '#0891b2'] as const,
  accent: ['#8b5cf6', '#7c3aed'] as const,
  warning: ['#f59e0b', '#d97706'] as const,
  danger: ['#ef4444', '#dc2626'] as const,
  card: ['#1a1d27', '#212435'] as const,
  dark: ['#0f1117', '#1a1d27'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
