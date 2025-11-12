import React, { useState, useEffect, useRef } from 'react';
import type { AnalysisRecord, ChatMessage as ChatMessageProps, FinalReport, Diagnosis, PatientData, DetectedMedication, DiagnosisFeedback, PrognosisReport } from '../types';
import * as aiService from '../services/aiCouncilService';
import { useTranslation } from '../hooks/useTranslation';

// --- Components ---
import SpinnerIcon from './icons/SpinnerIcon';
import DifferentialDiagnosisPanel from './DifferentialDiagnosisPanel';
import DDxTreeView from './DDxTreeView';
import ChatMessage from './ChatMessage';
import FinalReportCard from './FinalReportCard';
import PrognosisCard from './report/PrognosisCard';
import DownloadPanel from './DownloadPanel';
import DebateStatusIndicator from './DebateStatusIndicator';

// --- Icons ---
import SendIcon from './icons/SendIcon';
import ViewListIcon from './icons/ViewListIcon';
import DiagramIcon from './icons/DiagramIcon';
import LightBulbIcon from './icons/LightBulbIcon';


interface AnalysisViewProps {
    record: Partial<AnalysisRecord>;
    isLive: boolean;
    statusMessage: string;
    isAnalyzing: boolean;
    differentialDiagnoses: Diagnosis[];
    error: string | null;
    diagnosisFeedback: Record<string, DiagnosisFeedback>;
    userIntervention: string | null;
    socraticQuestion: string | null;
    livePrognosis: PrognosisReport | null;
    onDiagnosisFeedback: (name: string, feedback: DiagnosisFeedback) => void;
    onStartDebate: () => void;
    onInjectHypothesis: (hypothesis: Diagnosis) => void;
    onUserIntervention: (intervention: string) => void;
    onExplainRationale: (message: ChatMessageProps) => void;
    onGoToEducation: () => void;
    onRunScenario: (scenario: string) => Promise<FinalReport | null>;
    onUpdateReport: (updatedReport: Partial<FinalReport>) => void;
}


const AnalysisView: React.FC<AnalysisViewProps> = (props) => {
    const { 
        record, isLive, statusMessage, isAnalyzing, differentialDiagnoses, error, 
        diagnosisFeedback, onDiagnosisFeedback, onStartDebate, onInjectHypothesis, 
        onUserIntervention, onExplainRationale, onGoToEducation, socraticQuestion,
        livePrognosis, onRunScenario, onUpdateReport
    } = props;
    
    const debateScrollRef = useRef<HTMLDivElement>(null);
    const [interventionText, setInterventionText] = useState('');
    const [ddxView, setDdxView] = useState<'list' | 'tree'>('list');
    const [scenarioText, setScenarioText] = useState('');
    const [isScenarioRunning, setIsScenarioRunning] = useState(false);
    const [scenarioResult, setScenarioResult] = useState<FinalReport | null>(null);

    useEffect(() => {
        if (debateScrollRef.current) {
            debateScrollRef.current.scrollTop = debateScrollRef.current.scrollHeight;
        }
    }, [record.debateHistory, statusMessage, socraticQuestion]);

    const { patientData: pd, debateHistory: dh = [], finalReport: fr = null } = record;

    const handleInterventionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!interventionText.trim() || (!isAnalyzing && !socraticQuestion)) return;
        onUserIntervention(interventionText);
        setInterventionText('');
    };
    
    const handleRunScenario = async () => {
        if (!scenarioText.trim()) return;
        setIsScenarioRunning(true);
        setScenarioResult(null);
        const result = await onRunScenario(scenarioText);
        setScenarioResult(result);
        setIsScenarioRunning(false);
    };

    const { t } = useTranslation();
    if (!pd) return <div className="text-center p-8">{t('error_no_data_found')}</div>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
            {/* Left Panel: Patient Data */}
            <div className="xl:col-span-3 glass-panel p-5 overflow-y-auto h-full">
                <h3 className="text-lg font-bold text-text-primary">{t('analysis_patient_title', { name: `${pd.firstName} ${pd.lastName}`.trim() })}</h3>
                <div className="mt-4 space-y-3 text-sm">
                    <p><strong className="text-text-secondary">{t('analysis_age_label')}</strong> {pd.age}</p>
                    <p><strong className="text-text-secondary">{t('analysis_gender_label')}</strong> {pd.gender === 'male' ? t('data_input_gender_male') : pd.gender === 'female' ? t('data_input_gender_female') : t('data_input_gender_other')}</p>
                    <p><strong className="text-text-secondary">{t('analysis_complaints_label')}</strong> {pd.complaints}</p>
                    {pd.history && <p><strong className="text-text-secondary">{t('analysis_history_label')}</strong> {pd.history}</p>}
                    {pd.objectiveData && <p><strong className="text-text-secondary">{t('analysis_objective_label')}</strong> {pd.objectiveData}</p>}
                    {pd.labResults && <p><strong className="text-text-secondary">{t('analysis_lab_label')}</strong> {pd.labResults}</p>}
                    {pd.pharmacogenomicsReport && <p className="p-2 bg-purple-50 border border-purple-200 rounded-md"><strong className="text-purple-700">{t('analysis_pharmacogenomics_label')}</strong> {t('report_available')}</p>}
                </div>
            </div>

            {/* Center Panel: Interactive Analysis */}
            <div className="xl:col-span-5 glass-panel overflow-hidden flex flex-col h-full">
                 <div className="p-5 border-b border-border-color flex-shrink-0">
                    <h3 className="text-lg font-bold text-text-primary">{t('analysis_interactive_title')}</h3>
                    <p className="text-sm text-text-secondary">{statusMessage || t('analysis_process_subtitle')}</p>
                </div>
                <div ref={debateScrollRef} className="p-5 overflow-y-auto flex-grow">
                    {isAnalyzing && dh.length === 0 && !error && (
                        <div className="flex justify-center items-center h-full flex-col">
                            <SpinnerIcon className="w-8 h-8 text-accent-color-cyan" />
                            <p className="mt-2 text-text-secondary">{t('analysis_processing')}</p>
                        </div>
                    )}
                     {error && (
                        <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200" role="alert">
                            <span className="font-bold">{t('error_title')}</span> {error}
                        </div>
                    )}

                    {differentialDiagnoses.length > 0 && (
                        <>
                            <div className="flex justify-end items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-text-secondary">{t('analysis_view_label')}</span>
                                <button onClick={() => setDdxView('list')} className={`p-1 rounded-md ${ddxView === 'list' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}><ViewListIcon className="w-5 h-5"/></button>
                                <button onClick={() => setDdxView('tree')} className={`p-1 rounded-md ${ddxView === 'tree' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}><DiagramIcon className="w-5 h-5"/></button>
                            </div>
                            {ddxView === 'list' ? (
                                <DifferentialDiagnosisPanel 
                                    diagnoses={differentialDiagnoses} 
                                    onFeedback={onDiagnosisFeedback}
                                    feedbackState={diagnosisFeedback}
                                    onStartDebate={onStartDebate}
                                    isDebateStarted={dh.length > 0}
                                    onInjectHypothesis={onInjectHypothesis}
                                />
                            ) : (
                                <DDxTreeView diagnoses={differentialDiagnoses} onStartDebate={onStartDebate} isDebateStarted={dh.length > 0} />
                            )}
                        </>
                    )}
                    {dh.map(msg => <ChatMessage key={msg.id} message={msg} onExplainRationale={onExplainRationale} />)}
                    {isLive && isAnalyzing && dh.length > 0 && !socraticQuestion && (
                        <DebateStatusIndicator message={statusMessage} />
                    )}
                </div>
                {isLive && (isAnalyzing || socraticQuestion) && (
                    <div className="p-4 border-t border-border-color bg-slate-50/50">
                        {socraticQuestion ? (
                            <div className="animate-fade-in-up">
                                <p className="text-sm font-bold text-text-primary mb-2 text-center p-2 bg-yellow-100 border border-yellow-200 rounded-lg">{t('analysis_socratic_question_title')}</p>
                                <p className="text-center italic text-text-primary mb-3">"{socraticQuestion}"</p>
                                <form onSubmit={handleInterventionSubmit} className="flex gap-2">
                                    <input type="text" value={interventionText} onChange={(e) => setInterventionText(e.target.value)} placeholder={t('analysis_socratic_answer_placeholder')} className="flex-grow common-input" autoFocus />
                                    <button type="submit" className="p-2 rounded-lg animated-gradient-button text-white"><SendIcon className="w-5 h-5"/></button>
                                </form>
                            </div>
                        ) : (
                             <form onSubmit={handleInterventionSubmit} className="flex gap-2">
                                <input type="text" value={interventionText} onChange={(e) => setInterventionText(e.target.value)} placeholder={t('analysis_user_intervention_placeholder')} className="flex-grow block w-full rounded-lg sm:text-sm common-input px-3 py-2" />
                                <button type="submit" className="p-2 rounded-lg animated-gradient-button text-white"><SendIcon className="w-5 h-5"/></button>
                            </form>
                        )}
                    </div>
                )}
            </div>
            
            {/* Right Panel: Synthesis & Actions */}
            <div className="xl:col-span-4 glass-panel overflow-hidden flex flex-col h-full">
                <div className="p-5 border-b border-border-color">
                    <h3 className="text-lg font-bold text-text-primary">{t('analysis_results_title')}</h3>
                </div>
                <div className="p-5 overflow-y-auto flex-grow">
                    {fr ? (
                        <div className="space-y-6">
                            <FinalReportCard report={fr} patientData={pd} onUpdateReport={onUpdateReport} />
                            
                            <div className="mt-8 pt-6 border-t-2 border-dashed border-border-color">
                                <h3 className="text-xl font-bold text-text-primary mb-3 flex items-center gap-2"><LightBulbIcon className="w-6 h-6 text-purple-500" /> {t('analysis_scenario_title')}</h3>
                                <p className="text-sm text-text-secondary mb-3">{t('analysis_scenario_subtitle')}</p>
                                <textarea value={scenarioText} onChange={e => setScenarioText(e.target.value)} rows={3} placeholder={t('analysis_scenario_placeholder')} className="w-full common-input" />
                                <button onClick={handleRunScenario} disabled={isScenarioRunning} className="w-full animated-gradient-button font-bold py-2 px-4 rounded-lg mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isScenarioRunning ? <><SpinnerIcon className="w-5 h-5"/> {t('analysis_scenario_analyzing')}</> : t('analysis_scenario_run_button')}
                                </button>
                                {scenarioResult && <FinalReportCard report={scenarioResult} patientData={pd} isScenario={true} />}
                            </div>
                            
                            <DownloadPanel record={record} />
                            <button onClick={onGoToEducation} className="w-full animated-gradient-button font-bold py-3 px-4 rounded-lg">
                                {t('analysis_open_education_portal')}
                            </button>
                        </div>
                    ) : (
                        <PrognosisCard prognosis={livePrognosis} isLoading={isAnalyzing && !livePrognosis} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisView;