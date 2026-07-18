'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { en, Translations } from '@/locales/en';
import { it } from '@/locales/it';

export type Language = 'en' | 'it';

const dictionaries: Record<Language, Translations> = { en, it };

interface TranslationContextType {
    t: (path: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const t = useCallback((path: string): string => {
        const keys = path.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = dictionaries[language];
        
        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`[i18n] Missing translation for key: ${path}`);
                return path; 
            }
            current = current[key];
        }
        return current;
    }, [language]);

    return (
        <TranslationContext.Provider value={{ t, language, setLanguage }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}