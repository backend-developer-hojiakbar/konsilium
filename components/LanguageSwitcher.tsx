import React, { useState, useRef, useEffect } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';
import type { Language } from '../i18n/LanguageContext';

const languageOptions: { id: Language; label: string; short: string; }[] = [
    { id: 'uz-L', label: "O'zbekcha (Lotin)", short: "UZ-L" },
    { id: 'uz-C', label: "Ўзбекча (Кирилл)", short: "UZ-C" },
    { id: 'ru', label: "Русский", short: "RU" },
    { id: 'en', label: "English", short: "EN" },
];


interface LanguageSwitcherProps {
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ language, onLanguageChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const currentLang = languageOptions.find(l => l.id === language) || languageOptions[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    const handleSelect = (lang: Language) => {
        onLanguageChange(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-200/50 transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Change language"
            >
                <span className="text-sm font-semibold text-text-secondary">{currentLang.short}</span>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-panel-bg-solid rounded-lg shadow-lg border border-border-color z-30 animate-fade-in-up" style={{ animationDuration: '0.2s'}} role="menu">
                    <ul className="p-1">
                        {languageOptions.map(option => (
                            <li key={option.id} role="none">
                                <button
                                    onClick={() => handleSelect(option.id)}
                                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${language === option.id ? 'bg-slate-100 font-semibold text-text-primary' : 'text-text-secondary hover:bg-slate-100'}`}
                                    role="menuitem"
                                >
                                    {option.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;