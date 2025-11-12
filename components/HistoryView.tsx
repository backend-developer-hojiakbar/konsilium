import React from 'react';
import type { AnalysisRecord } from '../types';
import DocumentReportIcon from './icons/DocumentReportIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { useTranslation } from '../hooks/useTranslation';

interface HistoryViewProps {
    analyses: AnalysisRecord[];
    onSelectAnalysis: (record: AnalysisRecord) => void;
    onViewCaseLibrary: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ analyses, onSelectAnalysis, onViewCaseLibrary }) => {
    const { t } = useTranslation();
    if (analyses.length === 0) {
        return (
            <div className="text-center py-16 animate-fade-in-up">
                <DocumentReportIcon className="mx-auto w-16 h-16 text-slate-300" />
                <h3 className="mt-4 text-xl font-semibold text-text-primary">{t('history_empty_title')}</h3>
                <p className="mt-2 text-text-secondary">{t('history_empty_desc')}</p>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in-up space-y-6">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">{t('history_title')}</h2>
                    <p className="text-text-secondary">{t('history_subtitle')}</p>
                </div>
                <button onClick={onViewCaseLibrary} className="flex items-center gap-2 text-sm font-semibold animated-gradient-button px-4 py-2">
                    <BookOpenIcon className="w-5 h-5"/>
                    <span>{t('history_case_library_button')}</span>
                </button>
            </div>
            
            <div className="space-y-4">
                {analyses.map((record) => (
                    <div key={record.id} className="glass-panel p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                            <DocumentReportIcon className="w-10 h-10 text-accent-color-blue flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold text-text-primary truncate">{record.patientData.firstName} {record.patientData.lastName}</p>
                                <p className="text-sm text-text-secondary truncate">
                                    {record.finalReport.consensusDiagnosis[0]?.name || t('unknown_diagnosis')}
                                </p>
                                <p className="text-xs text-text-secondary mt-1">
                                    {(() => {
                                        const lang = (typeof window !== 'undefined' && (window as any).__app_language__) || 'uz-L';
                                        const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ';
                                        return new Date(record.date).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' });
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                            <button
                                onClick={() => onSelectAnalysis(record)}
                                className="animated-gradient-button text-sm font-semibold px-4 py-2"
                            >
                                {t('view')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryView;