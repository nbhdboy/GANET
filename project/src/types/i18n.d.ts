export type TranslationKey = keyof typeof translations.en;

export type Translations = {
  [key: string]: {
    [K in TranslationKey]: string;
  };
};

declare const translations: Translations;
export default translations; 