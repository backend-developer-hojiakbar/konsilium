import React, { useState } from 'react';
import { checkDrugInteractions } from '../../services/aiCouncilService';
import type { DrugInteraction } from '../../types';
import SpinnerIcon from '../icons/SpinnerIcon';
import { useTranslation } from '../../hooks/useTranslation';

const DrugInteractionChecker: React.FC = () => {
    const { language, t } = useTranslation();
    const [drugList, setDrugList] = useState('Warfarin\nAspirin\nIbuprofen\nAtorvastatin');
    const [interactions, setInteractions] = useState<DrugInteraction[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async () => {
        if (!drugList.trim()) {
            setError(t('tool_drug_error_input_required'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setInteractions(null);
        try {
            // FIX: Added missing 'language' argument.
            const result = await checkDrugInteractions(drugList, language);
            setInteractions(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('tool_common_unknown_error'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const getSeverityStyles = (severity: DrugInteraction['severity']) => {
        switch (severity) {
            case 'High':
                return {
                    border: 'border-red-500',
                    bg: 'bg-red-50',
                    text: 'text-red-800',
                    label: t('tool_drug_severity_high')
                };
            case 'Medium':
                 return {
                    border: 'border-yellow-500',
                    bg: 'bg-yellow-50',
                    text: 'text-yellow-800',
                    label: t('tool_drug_severity_medium')
                };
            case 'Low':
                 return {
                    border: 'border-blue-500',
                    bg: 'bg-blue-50',
                    text: 'text-blue-800',
                    label: t('tool_drug_severity_low')
                };
            default:
                 return {
                    border: 'border-slate-400',
                    bg: 'bg-slate-50',
                    text: 'text-slate-800',
                    label: t('tool_drug_severity_unknown')
                };
        }
    }

    return (
        <div className="glass-panel p-6 md:p-8">
            <h3 className="text-xl font-bold text-text-primary">{t('tool_drug_title')}</h3>
            <p className="text-sm text-text-secondary mt-1 mb-6">{t('tool_drug_subtitle')}</p>

            <div className="space-y-4">
                <textarea
                    value={drugList}
                    onChange={(e) => setDrugList(e.target.value)}
                    rows={6}
                    className="block w-full sm:text-sm common-input focus:border-accent-color-blue focus:ring focus:ring-blue-500/30 placeholder-zinc-500 transition shadow-sm px-3 py-2"
                    placeholder={t('tool_drug_placeholder')}
                />
                <button
                    onClick={handleCheck}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-3 py-3 px-4 shadow-lg text-base font-bold animated-gradient-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue disabled:opacity-70 transition-all"
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon className="w-5 h-5" />
                            {t('tool_drug_loading')}
                        </>
                    ) : t('tool_drug_button')}
                </button>
            </div>

            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            
            <div className="mt-8 space-y-4">
                {interactions && interactions.length > 0 && (
                    <h4 className="text-lg font-semibold text-text-primary">{t('tool_drug_results_title')}</h4>
                )}
                {interactions?.map((item, index) => {
                    const styles = getSeverityStyles(item.severity);
                    return (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${styles.border} ${styles.bg}`}>
                             <div className="flex justify-between items-center">
                                <h5 className="font-bold text-lg text-text-primary">{item.interaction}</h5>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles.text} ${styles.bg} border ${styles.border}`}>{styles.label}</span>
                            </div>
                            <div className="mt-3 space-y-3 text-sm">
                                <div>
                                    <p className="font-semibold text-text-primary">{t('tool_drug_mechanism_label')}</p>
                                    <p className="text-text-secondary">{item.mechanism}</p>
                                </div>
                                 <div>
                                    <p className="font-semibold text-text-primary">{t('tool_drug_management_label')}</p>
                                    <p className="text-text-secondary">{item.management}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {interactions && interactions.length === 0 && (
                     <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-semibold text-green-700">{t('tool_drug_none_title')}</p>
                        <p className="text-sm text-green-600">{t('tool_drug_none_note')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DrugInteractionChecker;