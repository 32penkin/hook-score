export const darkColors = {
  background: '#080A0F',
  backgroundSoft: '#0E121A',
  surface: '#121823',
  surfaceElevated: '#182130',
  surfaceMuted: '#202A3A',
  text: '#F7FAFC',
  textMuted: '#9AA8BA',
  textSubtle: '#68778A',
  border: '#2B3647',
  borderStrong: '#405069',
  accent: '#56F09F',
  accentDark: '#163D2A',
  coral: '#FF6B6B',
  orange: '#FF9F43',
  amber: '#F7C948',
  sky: '#5CC8FF',
  violet: '#A78BFA',
  danger: '#FF4D67',
  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors = {
  background: '#F4F7FB',
  backgroundSoft: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF3F8',
  surfaceMuted: '#E1E8F0',
  text: '#101720',
  textMuted: '#516173',
  textSubtle: '#7A8796',
  border: '#D8E0EA',
  borderStrong: '#BBC8D6',
  accent: '#0EBE70',
  accentDark: '#DFF8EC',
  coral: '#E55757',
  orange: '#C76B00',
  amber: '#A36B00',
  sky: '#087EB8',
  violet: '#7156D9',
  danger: '#D93652',
  white: '#FFFFFF',
  black: '#000000',
};

export const colors = darkColors;

export type AppColorScheme = 'light' | 'dark';
export type ThemeMode = 'system' | AppColorScheme;
export type AppColors = typeof darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
};

export const typography = {
  title: 34,
  h1: 28,
  h2: 22,
  body: 16,
  small: 13,
  micro: 11,
};
