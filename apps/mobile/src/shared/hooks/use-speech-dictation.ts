import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

import { Locale } from '../i18n/translations';

type SpeechRecognitionPackage = typeof import('expo-speech-recognition');
type EventSubscription = {
  remove: () => void;
};

const speechLanguageByLocale: Record<Locale, string> = {
  en: 'en-US',
  pl: 'pl-PL',
  ru: 'ru-RU',
};

let speechRecognitionPackagePromise: Promise<SpeechRecognitionPackage | null> | null = null;
let activeDictationId: string | null = null;
let nextDictationId = 0;

const loadSpeechRecognitionPackage = () => {
  speechRecognitionPackagePromise ??= import('expo-speech-recognition').catch(() => null);

  return speechRecognitionPackagePromise;
};

const isRecognitionAvailable = (speechRecognitionPackage: SpeechRecognitionPackage) => {
  try {
    return speechRecognitionPackage.ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
};

const mergeDictationText = (baseText: string, transcript: string) => {
  const normalizedTranscript = transcript.replace(/\s+/g, ' ').trim();

  if (!normalizedTranscript) {
    return baseText;
  }

  const trimmedBase = baseText.replace(/\s+$/g, '');

  if (!trimmedBase) {
    return normalizedTranscript;
  }

  const needsSeparator = !/^[,.;:!?]/.test(normalizedTranscript);

  return `${trimmedBase}${needsSeparator ? ' ' : ''}${normalizedTranscript}`;
};

type UseSpeechDictationInput = {
  disabled?: boolean;
  permissionDeniedMessage: string;
  permissionDeniedTitle: string;
  locale: Locale;
  onChangeText: (value: string) => void;
  unavailableMessage: string;
  unavailableTitle: string;
  value: string;
};

export function useSpeechDictation({
  disabled,
  permissionDeniedMessage,
  permissionDeniedTitle,
  locale,
  onChangeText,
  unavailableMessage,
  unavailableTitle,
  value,
}: UseSpeechDictationInput) {
  const dictationIdRef = useRef(`dictation-${nextDictationId += 1}`);
  const baseTextRef = useRef('');
  const onChangeTextRef = useRef(onChangeText);
  const valueRef = useRef(value);
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    onChangeTextRef.current = onChangeText;
  }, [onChangeText]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let isMounted = true;
    const subscriptions: EventSubscription[] = [];

    void loadSpeechRecognitionPackage().then((speechRecognitionPackage) => {
      if (!isMounted || !speechRecognitionPackage) {
        setIsAvailable(false);
        return;
      }

      const { ExpoSpeechRecognitionModule } = speechRecognitionPackage;

      if (!isRecognitionAvailable(speechRecognitionPackage)) {
        setIsAvailable(false);
        return;
      }

      setIsAvailable(true);

      subscriptions.push(
        ExpoSpeechRecognitionModule.addListener(
          'result',
          (event: ExpoSpeechRecognitionResultEvent) => {
            if (activeDictationId !== dictationIdRef.current) {
              return;
            }

            const transcript = event.results[0]?.transcript ?? '';
            onChangeTextRef.current(mergeDictationText(baseTextRef.current, transcript));
          }
        )
      );

      subscriptions.push(
        ExpoSpeechRecognitionModule.addListener(
          'error',
          (_event: ExpoSpeechRecognitionErrorEvent) => {
            if (activeDictationId !== dictationIdRef.current) {
              return;
            }

            activeDictationId = null;
            setIsListening(false);
          }
        )
      );

      subscriptions.push(
        ExpoSpeechRecognitionModule.addListener('end', () => {
          if (activeDictationId !== dictationIdRef.current) {
            return;
          }

          activeDictationId = null;
          setIsListening(false);
        })
      );
    });

    return () => {
      isMounted = false;
      subscriptions.forEach((subscription) => subscription.remove());

      if (activeDictationId === dictationIdRef.current) {
        activeDictationId = null;
        void loadSpeechRecognitionPackage().then((speechRecognitionPackage) => {
          try {
            speechRecognitionPackage?.ExpoSpeechRecognitionModule.abort();
          } catch {
            // Ignore shutdown errors; the dictation session is already being discarded.
          }
        });
      }
    };
  }, []);

  const stop = useCallback(async () => {
    const speechRecognitionPackage = await loadSpeechRecognitionPackage();

    try {
      speechRecognitionPackage?.ExpoSpeechRecognitionModule.stop();
    } catch {
      activeDictationId = null;
      setIsListening(false);
    }
  }, []);

  const start = useCallback(async () => {
    if (disabled) {
      return;
    }

    const speechRecognitionPackage = await loadSpeechRecognitionPackage();

    if (!speechRecognitionPackage) {
      setIsAvailable(false);
      Alert.alert(unavailableTitle, unavailableMessage);
      return;
    }

    const { ExpoSpeechRecognitionModule } = speechRecognitionPackage;

    if (!isRecognitionAvailable(speechRecognitionPackage)) {
      setIsAvailable(false);
      Alert.alert(unavailableTitle, unavailableMessage);
      return;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => null);

    if (!permission?.granted) {
      Alert.alert(permissionDeniedTitle, permissionDeniedMessage);
      return;
    }

    if (activeDictationId && activeDictationId !== dictationIdRef.current) {
      ExpoSpeechRecognitionModule.abort();
    }

    activeDictationId = dictationIdRef.current;
    baseTextRef.current = valueRef.current;
    setIsListening(true);

    try {
      ExpoSpeechRecognitionModule.start({
        addsPunctuation: true,
        continuous: false,
        interimResults: true,
        lang: speechLanguageByLocale[locale],
        maxAlternatives: 1,
      });
    } catch {
      activeDictationId = null;
      setIsListening(false);
      Alert.alert(unavailableTitle, unavailableMessage);
    }
  }, [
    disabled,
    locale,
    permissionDeniedMessage,
    permissionDeniedTitle,
    unavailableMessage,
    unavailableTitle,
  ]);

  const toggle = useCallback(() => {
    if (isListening) {
      void stop();
      return;
    }

    void start();
  }, [isListening, start, stop]);

  useEffect(() => {
    if (disabled && isListening) {
      void stop();
    }
  }, [disabled, isListening, stop]);

  return {
    isAvailable,
    isListening,
    toggle,
  };
}
