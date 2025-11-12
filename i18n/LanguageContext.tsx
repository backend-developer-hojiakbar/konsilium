import React, { createContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'uz-L' | 'uz-C' | 'ru' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem('app_language');
            if (saved === 'uz-L' || saved === 'uz-C' || saved === 'ru' || saved === 'en') {
                return saved as Language;
            }
        } catch {}
        return 'uz-L';
    });
    const setAndPersist = (lang: Language) => {
        // Avoid redundant work if selecting the same language
        if (lang === language) return;
        setLanguage(lang);
        try { localStorage.setItem('app_language', lang); } catch {}
        try { (window as any).__app_language__ = lang; } catch {}
        // Force a full reload so all content re-renders in the selected language
        // This avoids stale module state and ensures third-party libs pick up the new locale
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
            }
        }, 0);
    };
    useEffect(() => {
        try {
            (window as any).__app_language__ = language;
            const html = document.documentElement;
            if (html) {
                html.setAttribute('lang', language === 'ru' ? 'ru' : language === 'en' ? 'en' : 'uz');
            }
        } catch {}
    }, [language]);
    
    return (
        <LanguageContext.Provider value={{ language, setLanguage: setAndPersist }}>
            {children}
        </LanguageContext.Provider>
    );
};
