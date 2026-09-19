import React, { createContext, useContext, useMemo } from 'react';
import type { AppLanguage } from '../types/models';
import { ptBR } from './locales/ptBR';
import { enUS } from './locales/enUS';
import { esES } from './locales/esES';

export type TranslationSchema = typeof ptBR;

const translationsMap: Record<AppLanguage, TranslationSchema> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
};

interface I18nContextValue {
  language: AppLanguage;
  locale: string;
  t: (path: string, params?: Record<string, string | number>) => string;
  dict: TranslationSchema;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'pt-BR',
  locale: 'pt-BR',
  t: (path: string) => path,
  dict: ptBR,
});

interface I18nProviderProps {
  language?: AppLanguage;
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ language = 'pt-BR', children }) => {
  const currentLang = (['pt-BR', 'en-US', 'es-ES'].includes(language) ? language : 'pt-BR') as AppLanguage;
  const dict = translationsMap[currentLang] || ptBR;

  const value = useMemo<I18nContextValue>(() => {
    const t = (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let current: unknown = dict;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          // Fallback para pt-BR se não encontrado
          let fallback: unknown = ptBR;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = (fallback as Record<string, unknown>)[fbKey];
            } else {
              fallback = null;
              break;
            }
          }
          current = fallback ?? path;
          break;
        }
      }

      if (typeof current !== 'string') {
        return path;
      }

      if (params) {
        let result = current;
        for (const [paramKey, paramVal] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        }
        return result;
      }

      return current;
    };

    return {
      language: currentLang,
      locale: currentLang,
      t,
      dict,
    };
  }, [currentLang, dict]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}

