'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { SudokuContainer } from '@/app/components/sudoku/SudokuContainer';
import { useTranslation } from '@/lib/i18n/TranslationContext';

export default function PlayRoomPage() {
    const { t } = useTranslation();
    const params = useParams();
    const roomId = params.roomId as string;
    
    const [copied, setCopied] = useState(false);

    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="w-full flex flex-col items-center p-4 sm:p-8">
            <header className="w-full max-w-2xl flex items-center justify-center mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">{t('sudoku.room')}: <span className="font-mono text-[var(--number-player)]">{roomId}</span></h1>
                    <button 
                        onClick={copyInviteLink}
                        className="px-3 py-1.5 text-sm font-medium bg-[var(--cell-background-highlight)] hover:bg-[var(--cell-background-initial)] rounded-md transition-colors border border-[var(--grid-border-inner)]"
                        aria-label="Copy invitation link"
                    >
                        {copied ? `${t('sudoku.copied')}! ✨` : `${t('sudoku.copyLink')} 🔗`}
                    </button>
                </div>
            </header>
            
            <SudokuContainer roomId={roomId} />
        </div>
    );
}