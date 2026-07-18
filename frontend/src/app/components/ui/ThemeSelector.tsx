'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Dropdown, DropdownOption } from './Dropdown';

export function ThemeSelector() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, themes } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className={cn(
                "h-[42px] w-[110px] rounded-md", 
                "bg-[var(--cell-background-initial)] border border-[var(--grid-border-inner)]",
                "animate-pulse"
            )} />
        );
    }

    const themeOptions: DropdownOption<string>[] = themes.map(t => ({
        value: t,
        label: t
    }));

    return (
        <Dropdown<string>
            value={theme || 'system'}
            options={themeOptions}
            onChange={setTheme}
            className="min-w-[110px]"
        />
    );
}