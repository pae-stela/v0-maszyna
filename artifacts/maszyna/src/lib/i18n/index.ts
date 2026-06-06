// src/lib/i18n/index.ts
import { translations, Language } from "./translations";

export const getT = (lang: string | undefined) => {
  const currentLang = (lang === 'pl' ? 'pl' : 'en') as Language;
  return translations[currentLang];
};