import { ReactNode, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { radii, spacing, typography } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';

export type TextFieldProps = TextInputProps & {
  label: string;
  rightAccessory?: ReactNode;
};

export function TextField({
  label,
  onBlur,
  onFocus,
  rightAccessory,
  style,
  ...props
}: TextFieldProps) {
  const { colors } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isEditable = props.editable !== false;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      <TextInput
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.accent}
        style={[
          styles.input,
          {
            borderColor: isFocused && isEditable ? colors.accent : colors.border,
            backgroundColor:
              isFocused && isEditable ? colors.surfaceElevated : colors.backgroundSoft,
            color: colors.text,
          },
          props.multiline && styles.multiline,
          props.editable === false && styles.disabled,
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.small,
    fontWeight: '700',
  },
  accessory: {
    flexShrink: 0,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
  multiline: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  disabled: {
    opacity: 0.6,
  },
});
