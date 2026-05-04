import { Appearance, ColorSchemeName } from 'react-native';
import { makeAutoObservable } from 'mobx';

import { AppColorScheme, darkColors, lightColors, ThemeMode } from './theme';

export class ThemeStore {
  mode: ThemeMode = 'system';
  systemScheme: AppColorScheme = this.normalizeScheme(Appearance.getColorScheme());

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    Appearance.addChangeListener(({ colorScheme }) => {
      this.systemScheme = this.normalizeScheme(colorScheme);
    });
  }

  get resolvedScheme(): AppColorScheme {
    return this.mode === 'system' ? this.systemScheme : this.mode;
  }

  get colors() {
    return this.resolvedScheme === 'dark' ? darkColors : lightColors;
  }

  setMode(mode: ThemeMode) {
    this.mode = mode;
  }

  private normalizeScheme(scheme: ColorSchemeName): AppColorScheme {
    return scheme === 'dark' ? 'dark' : 'light';
  }
}
