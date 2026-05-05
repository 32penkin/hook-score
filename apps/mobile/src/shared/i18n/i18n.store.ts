import { getLocales } from 'expo-localization';
import type { Locale as DeviceLocale } from 'expo-localization';
import { makeAutoObservable } from 'mobx';

import { Locale, TranslationKey, translations } from './translations';

type LocaleSource = 'device' | 'manual';
type DeviceLocaleInput = Pick<DeviceLocale, 'languageCode' | 'languageTag'>;

const fallbackLocale: Locale = 'en';
const supportedLocales = Object.keys(translations) as Locale[];

const getSupportedLanguageCode = (value: string | null | undefined) => {
  const languageCode = value?.trim().toLowerCase().replace('_', '-').split('-')[0];

  return supportedLocales.includes(languageCode as Locale) ? (languageCode as Locale) : null;
};

export const resolveDeviceLocale = (deviceLocales: DeviceLocaleInput[] = getLocales()) => {
  const primaryDeviceLocale = deviceLocales[0];

  if (!primaryDeviceLocale) {
    return fallbackLocale;
  }

  return (
    getSupportedLanguageCode(primaryDeviceLocale.languageCode) ??
    getSupportedLanguageCode(primaryDeviceLocale.languageTag) ??
    fallbackLocale
  );
};

export class I18nStore {
  locale: Locale = resolveDeviceLocale();
  private localeSource: LocaleSource = 'device';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setLocale(locale: Locale) {
    this.localeSource = 'manual';
    this.locale = locale;
  }

  syncDeviceLocales(deviceLocales: DeviceLocaleInput[]) {
    if (this.localeSource === 'manual') {
      return;
    }

    this.locale = resolveDeviceLocale(deviceLocales);
  }

  t(key: TranslationKey) {
    return translations[this.locale][key] ?? translations.en[key];
  }
}
