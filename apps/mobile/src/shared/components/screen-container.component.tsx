import { PropsWithChildren, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../theme/theme';
import { useAppTheme } from '../theme/theme.provider';

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function ScreenContainer({ children, scroll = true }: ScreenContainerProps) {
  const { colors } = useAppTheme();
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) {
        return;
      }

      if (reduceMotion) {
        reveal.setValue(1);
        return;
      }

      Animated.timing(reveal, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      isMounted = false;
      reveal.stopAnimation();
    };
  }, [reveal]);

  const revealStyle = {
    opacity: reveal,
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const content = scroll ? (
    <Animated.ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={[styles.contentLayer, revealStyle]}
    >
      {children}
    </Animated.ScrollView>
  ) : (
    <Animated.View style={[styles.staticContent, revealStyle]}>{children}</Animated.View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View
          style={[
            styles.backdropBar,
            styles.backdropBarTop,
            { backgroundColor: colors.coral },
          ]}
        />
        <View
          style={[
            styles.backdropBar,
            styles.backdropBarMiddle,
            { backgroundColor: colors.amber },
          ]}
        />
        <View
          style={[
            styles.backdropBar,
            styles.backdropBarBottom,
            { backgroundColor: colors.sky },
          ]}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
  },
  keyboard: {
    flex: 1,
    zIndex: 1,
  },
  contentLayer: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  staticContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropBar: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    opacity: 0.28,
  },
  backdropBarTop: {
    top: 76,
    right: -118,
    width: 156,
    transform: [{ rotate: '-8deg' }],
  },
  backdropBarMiddle: {
    top: 108,
    right: -96,
    width: 116,
    transform: [{ rotate: '-8deg' }],
  },
  backdropBarBottom: {
    bottom: 76,
    left: -54,
    width: 184,
    transform: [{ rotate: '8deg' }],
  },
});
