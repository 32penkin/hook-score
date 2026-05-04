import { makeAutoObservable } from 'mobx';

import { Locale, TranslationKey, translations } from './translations';

export class I18nStore {
  locale: Locale = 'en';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setLocale(locale: Locale) {
    this.locale = locale;
  }

  t(key: TranslationKey) {
    return translations[this.locale][key] ?? translations.en[key];
  }
}
