import { ComponentType } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { radii, spacing } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type IconButtonProps = {
  label: string;
  onPress: () => void;
  icon: ComponentType<IconProps>;
  disabled?: boolean;
  style?: ViewStyle;
};

export function IconButton({ label, onPress, icon: Icon, disabled, style }: IconButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.border, backgroundColor: colors.surface },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
    >
      <Icon color={colors.text} size={22} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  dimmed: {
    opacity: 0.72,
  },
});
