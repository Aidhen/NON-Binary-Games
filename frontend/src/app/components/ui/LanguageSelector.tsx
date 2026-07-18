'use client';

import { useTranslation, Language } from '@/lib/i18n/TranslationContext';
import { Dropdown, DropdownOption } from './Dropdown';

const SUPPORTED_LANGUAGES: DropdownOption<Language>[] = [
    { value: 'en', label: '🇬🇧 English' },
    { value: 'it', label: '🇮🇹 Italiano' },
];

export function LanguageSelector() {
    const { language, setLanguage } = useTranslation();

    return (
        <Dropdown<Language>
            value={language}
            options={SUPPORTED_LANGUAGES}
            onChange={setLanguage}
            className="min-w-[120px]"
        />
    );
}