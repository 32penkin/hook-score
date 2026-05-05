import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { darkColors, spacing, typography } from '../../shared/theme/theme';

const splashLogo = require('../../../assets/splash-icon.png');

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <View style={[styles.accentBar, styles.accentBarTop]} />
      <View style={[styles.accentBar, styles.accentBarMiddle]} />
      <View style={[styles.accentBar, styles.accentBarBottom]} />

      <View style={styles.content}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="HookScore"
          source={splashLogo}
          style={styles.logo}
        />
        <Text style={styles.brand}>HookScore</Text>
        <ActivityIndicator color={darkColors.accent} size="small" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: darkColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  logo: {
    width: 196,
    height: 196,
    borderRadius: 28,
  },
  brand: {
    color: darkColors.text,
    fontSize: typography.h2,
    fontWeight: '900',
    letterSpacing: 0,
  },
  accentBar: {
    position: 'absolute',
    left: -48,
    height: 8,
    width: 172,
    borderRadius: 4,
    transform: [{ rotate: '-8deg' }],
  },
  accentBarTop: {
    top: 132,
    backgroundColor: darkColors.coral,
  },
  accentBarMiddle: {
    top: 164,
    backgroundColor: darkColors.amber,
  },
  accentBarBottom: {
    top: 196,
    backgroundColor: darkColors.sky,
  },
});
