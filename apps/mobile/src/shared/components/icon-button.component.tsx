import { ComponentType, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';

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
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (value: number) => {
    Animated.spring(scale, {
      bounciness: 4,
      speed: 24,
      toValue: value,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animateScale(0.94)}
        onPressOut={() => animateScale(1)}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: pressed ? colors.borderStrong : colors.border,
            backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
          },
          (pressed || disabled) && styles.dimmed,
        ]}
      >
        <Icon color={colors.text} size={22} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 2,
  },
  dimmed: {
    opacity: 0.72,
  },
});
