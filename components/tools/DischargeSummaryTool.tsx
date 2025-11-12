import React, { useState } from 'react';
import { generateDischargeSummary } from '../../services/aiCouncilService';
import type { PatientData, FinalReport } from '../../types'; // Assuming these are available
import SpinnerIcon from '../icons/SpinnerIcon';
import { useTranslation } from '../../hooks/useTranslation';

// Mock data for standalone tool usage
const mockPatientData: PatientData = {
    firstName: 'Ali',
    lastName: 'Valiyev',
    age: '65',
    gender: 'male',
    complaints: 'To\'sh orti og\'rig\'i',
    history: 'Gipertoniya',
};

const mockFinalReport: FinalReport = {
    consensusDiagnosis: [{ name: 'O\'tkir Miokard Infarkti', probability: 95, justification: 'EKG o\'zgarishlari va troponinlar oshishi.', evidenceLevel: 'High' }],
    rejectedHypotheses: [],
    recommendedTests: [],
    treatmentPlan: ['Oldingi tushuvchi arteriyaga PCI', 'Ikki tomonlama antiagregant terapiya'],
    medicationRecommendations: [{name: 'Aspirin', dosage: '81mg har kuni', notes: ''}, {name: 'Atorvastatin', dosage: '80mg har kuni', notes: ''}],
    unexpectedFindings: '',
};


const DischargeSummaryTool: React.FC = () => {
    const { language, t } = useTranslation();
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setSummary(null);
        try {
            // In a real app, you would pass the actual patientData and finalReport
            // FIX: Added missing 'language' argument.
            const result = await generateDischargeSummary(mockPatientData, mockFinalReport, language);
            setSummary(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('tool_common_unknown_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 md:p-8">
            <h3 className="text-xl font-bold text-text-primary">{t('tool_discharge_title')}</h3>
            <p className="text-sm text-text-secondary mt-1 mb-6">{t('tool_discharge_subtitle')}</p>

            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 shadow-lg text-base font-bold animated-gradient-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue disabled:opacity-70 transition-all"
            >
                {isLoading ? <><SpinnerIcon className="w-5 h-5" /> {t('tool_discharge_loading')}</> : t('tool_discharge_button')}
            </button>

            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            
            <div className="mt-8">
                {summary && (
                    <div className="animate-fade-in-up">
                        <h4 className="text-lg font-semibold text-text-primary mb-2">{t('tool_discharge_result_title')}</h4>
                        <textarea
                            readOnly
                            value={summary}
                            rows={15}
                            className="block w-full sm:text-sm common-input bg-slate-50"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DischargeSummaryTool;