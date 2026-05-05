import { StyleSheet, Text, View } from 'react-native';

import { AppColors, radii, spacing, typography } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';

type InfoPillProps = {
  label: string;
  value: string;
  tone?: 'accent' | 'sky' | 'coral' | 'amber';
};

const getToneColor = (colors: AppColors) => ({
  accent: colors.accent,
  sky: colors.sky,
  coral: colors.coral,
  amber: colors.amber,
});

export function InfoPill({ label, value, tone = 'accent' }: InfoPillProps) {
  const { colors } = useAppTheme();
  const toneColor = getToneColor(colors);

  return (
    <View
      style={[
        styles.pill,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={[styles.toneRail, { backgroundColor: toneColor[tone] }]} />
      <Text style={[styles.label, { color: colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.value, { color: toneColor[tone] }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    minWidth: 96,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    gap: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 2,
  },
  toneRail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
  },
  label: {
    fontSize: typography.micro,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: typography.body,
    fontWeight: '900',
  },
});
