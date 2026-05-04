import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';

export type SegmentOption<T extends string | number> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

type MultiSegmentedControlProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T[];
  onToggle: (value: T) => void;
  disabled?: boolean;
};

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              selected && { backgroundColor: colors.text },
              disabled && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.background : colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MultiSegmentedControl<T extends string | number>({
  options,
  value,
  onToggle,
  disabled,
}: MultiSegmentedControlProps<T>) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {options.map((option) => {
        const selected = value.includes(option.value);

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            key={String(option.value)}
            onPress={() => onToggle(option.value)}
            style={[
              styles.option,
              selected && { backgroundColor: colors.text },
              disabled && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.background : colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    minWidth: 76,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.6,
  },
});
