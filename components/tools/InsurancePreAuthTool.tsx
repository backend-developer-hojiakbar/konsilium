import React, { useState } from 'react';
import { generateInsurancePreAuth } from '../../services/aiCouncilService';
import type { PatientData, FinalReport } from '../../types';
import SpinnerIcon from '../icons/SpinnerIcon';
import { useTranslation } from '../../hooks/useTranslation';

// Mock data for standalone tool usage
const mockPatientData: PatientData = {
    firstName: 'Oysha',
    lastName: 'Karimova',
    age: '52',
    gender: 'female',
    complaints: 'Qorin og\'rig\'i',
    history: 'GERK (Gastroezofageal reflyuks kasalligi)',
};

const mockFinalReport: FinalReport = {
    consensusDiagnosis: [{ name: 'O\'tkir xoletsistit', probability: 90, justification: 'UTT topilmalari va klinik belgilar.', evidenceLevel: 'High' }],
    rejectedHypotheses: [],
    recommendedTests: [],
    treatmentPlan: ['Laparoskopik xoletsistektomiya'],
    medicationRecommendations: [],
    unexpectedFindings: '',
};


const InsurancePreAuthTool: React.FC = () => {
    const { language, t } = useTranslation();
    const [procedure, setProcedure] = useState('Laparoskopik xoletsistektomiya');
    const [draft, setDraft] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if(!procedure.trim()) {
            setError(t('tool_insurance_error_input_required'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setDraft(null);
        try {
            // FIX: Added missing 'language' argument.
            const result = await generateInsurancePreAuth(mockPatientData, mockFinalReport, procedure, language);
            setDraft(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('tool_common_unknown_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 md:p-8">
            <h3 className="text-xl font-bold text-text-primary">{t('tool_insurance_title')}</h3>
            <p className="text-sm text-text-secondary mt-1 mb-6">{t('tool_insurance_subtitle')}</p>
             <div className="space-y-4 mb-4">
                 <label htmlFor="procedure" className="block text-sm font-medium text-text-secondary">{t('tool_insurance_label_procedure')}</label>
                 <input
                    type="text"
                    id="procedure"
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    className="block w-full sm:text-sm common-input"
                 />
             </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 shadow-lg text-base font-bold animated-gradient-button focus:outline-none disabled:opacity-70"
            >
                {isLoading ? <><SpinnerIcon className="w-5 h-5" /> {t('tool_insurance_loading')}</> : t('tool_insurance_button')}
            </button>

            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            
            <div className="mt-8">
                {draft && (
                    <div className="animate-fade-in-up">
                        <h4 className="text-lg font-semibold text-text-primary mb-2">{t('tool_insurance_result_title')}</h4>
                        <textarea
                            readOnly
                            value={draft}
                            rows={15}
                            className="block w-full sm:text-sm common-input bg-slate-50"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InsurancePreAuthTool;