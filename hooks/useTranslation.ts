import { useContext } from 'react';
import { LanguageContext } from '../i18n/LanguageContext';
import { translations } from '../i18n/locales';
import type { uzL } from '../i18n/locales/uzL';

// A type for all possible translation keys, based on the uz-L (Latin) which is our primary set.
export type TranslationKey = keyof typeof uzL;

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  const { language, setLanguage } = context;

  const langToLocale = (lang: string): string => (
    lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ'
  );

  const t = (key: TranslationKey, replacements?: { [key: string]: string | number }) => {
    // Fallback to Latin Uzbek if key is missing in the current language or if translations[language] is undefined.
    const languageStrings = translations[language] || translations['uz-L'];
    let translation = languageStrings[key] || translations['uz-L'][key] || key;

    // Pluralization support: if the translation string contains variant forms separated by '|'
    // and a numeric 'count' is provided, pick the correct variant using Intl.PluralRules
    const countVal = replacements && typeof replacements['count'] === 'number' ? (replacements['count'] as number) : undefined;
    if (typeof translation === 'string' && translation.includes('|') && typeof countVal === 'number') {
      const forms = translation.split('|').map(s => s.trim());
      const pr = new Intl.PluralRules(langToLocale(language));
      const category = pr.select(countVal); // e.g., 'one', 'few', 'many', 'other'
      let index = 0;
      if (forms.length === 3) {
        // Typical Russian-style 3 forms: one | few | many
        index = category === 'one' ? 0 : (category === 'few' ? 1 : 2);
      } else if (forms.length === 2) {
        // Simple singular/plural: one | other
        index = category === 'one' ? 0 : 1;
      } else {
        // Fallback: choose last form
        index = Math.min(forms.length - 1, 0);
      }
      translation = forms[index] || forms[forms.length - 1];
    }
    
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
      });
    }
    return translation;
  };

  return { t, setLanguage, language };
};
