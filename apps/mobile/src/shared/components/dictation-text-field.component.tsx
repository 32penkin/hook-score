import { Mic } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Locale } from '../i18n/translations';
import { radii, spacing } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';
import { useSpeechDictation } from '../hooks/use-speech-dictation';
import { TextField, TextFieldProps } from './text-field.component';

type DictationTextFieldProps = Omit<
  TextFieldProps,
  'onChangeText' | 'rightAccessory' | 'value'
> & {
  dictationLocale: Locale;
  dictationPermissionDeniedMessage: string;
  dictationPermissionDeniedTitle: string;
  dictationUnavailableMessage: string;
  dictationUnavailableTitle: string;
  dictateLabel: string;
  onChangeText: (value: string) => void;
  stopDictationLabel: string;
  value: string;
};

export function DictationTextField({
  dictationLocale,
  dictationPermissionDeniedMessage,
  dictationPermissionDeniedTitle,
  dictationUnavailableMessage,
  dictationUnavailableTitle,
  dictateLabel,
  editable,
  onChangeText,
  stopDictationLabel,
  value,
  ...props
}: DictationTextFieldProps) {
  const { colors } = useAppTheme();
  const isEditable = editable !== false;
  const { isAvailable, isListening, toggle } = useSpeechDictation({
    disabled: !isEditable,
    permissionDeniedMessage: dictationPermissionDeniedMessage,
    permissionDeniedTitle: dictationPermissionDeniedTitle,
    locale: dictationLocale,
    onChangeText,
    unavailableMessage: dictationUnavailableMessage,
    unavailableTitle: dictationUnavailableTitle,
    value,
  });

  return (
    <TextField
      editable={editable}
      onChangeText={onChangeText}
      rightAccessory={
        <Pressable
          accessibilityLabel={isListening ? stopDictationLabel : dictateLabel}
          accessibilityRole="button"
          disabled={!isEditable}
          hitSlop={6}
          onPress={toggle}
          style={({ pressed }) => [
            styles.dictationButton,
            {
              borderColor: isListening ? colors.accent : colors.border,
              backgroundColor: isListening ? colors.accentDark : colors.backgroundSoft,
            },
            (pressed || !isEditable || !isAvailable) && styles.dimmed,
          ]}
        >
          <Mic
            color={isListening ? colors.accent : colors.textMuted}
            size={18}
            strokeWidth={2.5}
          />
        </Pressable>
      }
      value={value}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  dictationButton: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  dimmed: {
    opacity: 0.7,
  },
});
