import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { PatientData, ChatMessage, FinalReport, ProgressUpdate, User, AnalysisRecord, Diagnosis, DetectedMedication, DiagnosisFeedback, CriticalFinding, CMETopic, UserStats, AppView, PrognosisReport } from './types';
import * as aiService from './services/aiCouncilService';
// import * as authService from './services/authService'; // replaced by backend JWT profile
// import * as caseService from './services/caseService'; // replaced by backend stats endpoint
import apiService from './services/apiService';
import { useTranslation } from './hooks/useTranslation';
import { Language } from './i18n/LanguageContext';

// --- Views & Components ---
import AuthPage from './components/AuthPage';
import DataInputForm from './components/DataInputForm';
import HistoryView from './components/HistoryView';
import MobileNavBar from './components/MobileNavBar';
import ResearchView from './components/ResearchView';
import ClarificationView from './components/ClarificationView';
import ToolsDashboard from './components/ToolsDashboard';
import Dashboard from './components/Dashboard';
import LiveConsultationView from './components/LiveConsultationView';
import AnalysisView from './components/AnalysisView';
import TeamRecommendationView from './components/TeamRecommendationView';
import CaseLibraryView from './components/CaseLibraryView';
import PatientEducationPortal from './components/education/PatientEducationPortal';
import CriticalFindingAlert from './components/modals/CriticalFindingAlert';
import RationaleModal from './components/modals/RationaleModal';
import LanguageSwitcher from './components/LanguageSwitcher';

// --- Icons ---
import HomeIcon from './components/icons/HomeIcon';
import PlusCircleIcon from './components/icons/PlusCircleIcon';
import DocumentReportIcon from './components/icons/DocumentReportIcon';
import ToolboxIcon from './components/icons/ToolboxIcon';
import LightBulbIcon from './components/icons/LightBulbIcon';
import BellIcon from './components/icons/BellIcon';
import CopyrightIcon from './components/icons/CopyrightIcon';
import SupportIcon from './components/icons/SupportIcon';

import { AIModel } from './constants/specialists';

const AppContent: React.FC = () => {
    // --- STATE MANAGEMENT ---
    
    // Auth & View
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [appView, setAppView] = useState<AppView>('dashboard');

    // i18n
    const { t, language, setLanguage } = useTranslation();

    // Map backend dashboard stats (snake_case) to frontend UserStats (camelCase)
    const mapStats = (s: any): UserStats => ({
        totalAnalyses: s?.total_analyses ?? s?.totalAnalyses ?? 0,
        commonDiagnoses: Array.isArray(s?.common_diagnoses)
            ? s.common_diagnoses.map((d: any) => ({ name: d?.name ?? 'Unknown', count: d?.count ?? 0 }))
            : Array.isArray(s?.commonDiagnoses)
                ? s.commonDiagnoses
                : [],
        feedbackAccuracy: s?.feedback_accuracy ?? s?.feedbackAccuracy ?? 0,
    });

    // Map backend Analysis objects to frontend AnalysisRecord
    const mapFromDetail = (a: any): AnalysisRecord => ({
        id: String(a.id),
        patientId: a.patient_id,
        date: a.created_at,
        patientData: a.patient_data || { firstName: '', lastName: '', age: '', gender: '', complaints: '' },
        debateHistory: a.debate_history || [],
        finalReport: a.final_report || { consensusDiagnosis: [], rejectedHypotheses: [], recommendedTests: [], treatmentPlan: [], medicationRecommendations: [], unexpectedFindings: '' },
        followUpHistory: a.follow_up_history || [],
        detectedMedications: a.detected_medications,
        selectedSpecialists: a.selected_specialists || [],
    });
    const mapFromList = (a: any): AnalysisRecord => {
        const fullName = (a.patient_name || '').trim();
        const [firstName, ...rest] = fullName.split(' ');
        const lastName = rest.join(' ');
        const dxName = a.diagnosis_summary || '';
        return {
            id: String(a.id),
            patientId: a.patient_id,
            date: a.created_at,
            patientData: { firstName: firstName || '', lastName: lastName || '', age: '', gender: '', complaints: '' } as any,
            debateHistory: [],
            finalReport: { consensusDiagnosis: dxName ? [{ name: dxName, probability: 0, justification: '', evidenceLevel: '' }] : [], rejectedHypotheses: [], recommendedTests: [], treatmentPlan: [], medicationRecommendations: [], unexpectedFindings: '' } as any,
            followUpHistory: [],
            detectedMedications: [],
            selectedSpecialists: [],
        };
    };
    const mapToRecord = (a: any): AnalysisRecord => (
        ('patient_data' in a) || ('final_report' in a)
            ? mapFromDetail(a)
            : mapFromList(a)
    );

    // Core Analysis State
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [selectedSpecialists, setSelectedSpecialists] = useState<AIModel[]>([]);
    const [differentialDiagnoses, setDifferentialDiagnoses] = useState<Diagnosis[]>([]);
    const [debateHistory, setDebateHistory] = useState<ChatMessage[]>([]);
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [diagnosisFeedback, setDiagnosisFeedback] = useState<Record<string, DiagnosisFeedback>>({});
    
    // Process & UI State
    const [isProcessing, setIsProcessing] = useState(false); // Generic loading state
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Interactive Feature States
    const [criticalFinding, setCriticalFinding] = useState<CriticalFinding | null>(null);
    const [rationaleMessage, setRationaleMessage] = useState<ChatMessage | null>(null);
    const [userIntervention, setUserIntervention] = useState<string | null>(null);
    const userInterventionRef = useRef<string | null>(null);
    const [recommendedTeam, setRecommendedTeam] = useState<{ model: AIModel; reason: string }[] | null>([]);
    const [socraticQuestion, setSocraticQuestion] = useState<string | null>(null);
    const [livePrognosis, setLivePrognosis] = useState<PrognosisReport | null>(null);

    
    // Data States
    const [userHistory, setUserHistory] = useState<AnalysisRecord[]>([]);
    const [dashboardStats, setDashboardStats] = useState<UserStats | null>(null);
    const [cmeTopics, setCmeTopics] = useState<CMETopic[]>([]);
    
    // View-specific data
    const [currentAnalysisRecord, setCurrentAnalysisRecord] = useState<AnalysisRecord | null>(null);
    const [clarificationQuestions, setClarificationQuestions] = useState<string[] | null>([]);
    
    const debateScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (debateScrollRef.current) {
            debateScrollRef.current.scrollTop = debateScrollRef.current.scrollHeight;
        }
    }, [debateHistory, statusMessage]);
    
    const handleProgress = useCallback((update: ProgressUpdate) => {
        switch (update.type) {
            case 'status': setStatusMessage(update.message); break;
            case 'message': setDebateHistory(prev => [...prev, update.message]); break;
            case 'critical_finding': setCriticalFinding(update.data); break;
            case 'user_question': setSocraticQuestion(update.question); break;
            case 'prognosis_update': setLivePrognosis(update.data); break;
            case 'report':
                setFinalReport(update.data);
                setIsProcessing(false);
                setSocraticQuestion(null);
                setStatusMessage(t('analysis_complete_status'));
                if (currentUser && patientData) {
                    const createPayload = {
                        patient_id: `${patientData.lastName}-${patientData.firstName}-${Date.now()}`,
                        patient_data: patientData,
                        debate_history: debateHistory,
                        final_report: update.data,
                        selected_specialists: selectedSpecialists,
                        follow_up_history: [],
                    } as any;
                    (async () => {
                        try {
                            const created = await apiService.analyses.create(createPayload);
                            const newRecord = mapFromDetail(created);
                            setCurrentAnalysisRecord(newRecord);
                            const [list, stats] = await Promise.all([
                                apiService.analyses.list(),
                                apiService.analyses.getDashboardStats(),
                            ]);
                            const items = Array.isArray(list) ? list : (list && Array.isArray((list as any).results) ? (list as any).results : []);
                            const history = items.map(mapFromList);
                            setUserHistory(history);
                            setDashboardStats(mapStats(stats));
                        } catch (e) {
                            // Fallback: keep local state updated even if backend fails
                            const fallbackRecord: AnalysisRecord = {
                                id: new Date().toISOString(),
                                patientId: `${patientData.lastName}-${patientData.firstName}-${Date.now()}`,
                                date: new Date().toISOString(),
                                patientData, debateHistory, finalReport: update.data,
                                followUpHistory: [], selectedSpecialists,
                            };
                            setCurrentAnalysisRecord(fallbackRecord);
                        }
                    })();
                }
                break;
            case 'error':
                setError(update.message);
                setIsProcessing(false);
                setStatusMessage(t('analysis_error_status'));
                break;
        }
    }, [currentUser, patientData, debateHistory, selectedSpecialists, t]);

    useEffect(() => {
        (async () => {
            try {
                const profile = await apiService.auth.getProfile();
                if (profile) await handleLoginSuccess(profile as User);
            } catch {}
        })();
    }, []);

    const handleLoginSuccess = async (user: User) => {
        setCurrentUser(user);
        try {
            const [list, stats] = await Promise.all([
                apiService.analyses.list(),
                apiService.analyses.getDashboardStats(),
            ]);
            const items = Array.isArray(list) ? list : (list && Array.isArray((list as any).results) ? (list as any).results : []);
            const history = items.map(mapToRecord);
            setUserHistory(history);
            setDashboardStats(mapStats(stats));
            aiService.suggestCmeTopics(history, language).then(setCmeTopics);
        } catch {
            setUserHistory([]);
            setDashboardStats(null);
        }
        setAppView('dashboard');
    };

    const handleLogout = async () => {
        try { await apiService.auth.logout(); } catch {}
        setCurrentUser(null);
        resetAnalysisState();
    };

    const resetAnalysisState = () => {
        setPatientData(null);
        setSelectedSpecialists([]);
        setDifferentialDiagnoses([]);
        setDebateHistory([]);
        setFinalReport(null);
        setDiagnosisFeedback({});
        setIsProcessing(false);
        setError(null);
        setStatusMessage('');
        setCurrentAnalysisRecord(null);
        setCriticalFinding(null);
        setRationaleMessage(null);
        setUserIntervention(null);
        userInterventionRef.current = null;
        setClarificationQuestions([]);
        setRecommendedTeam([]);
        setSocraticQuestion(null);
        setLivePrognosis(null);
        setAppView('new_analysis');
    };

    const handleNavigation = (view: AppView) => {
        if (view === 'new_analysis') resetAnalysisState();
        else setAppView(view);
    };

    const handleDataSubmit = async (data: PatientData) => {
        setPatientData(data);
        setIsProcessing(true);
        setAppView('clarification');
        setStatusMessage(t('clarification_generating_questions'));
        try {
            const questions = await aiService.generateClarifyingQuestions(data, language);
            setClarificationQuestions(questions);
        } catch (e) { 
             setError(t('clarification_question_error'));
             setClarificationQuestions([]);
        } 
        finally { setIsProcessing(false); }
    };
    
    const handleClarificationSubmit = async (answers: Record<string, string>) => {
        if (!patientData) return;
        
        let enrichedPatientData = { ...patientData };
        if (clarificationQuestions && clarificationQuestions.length > 0) {
            const qaString = clarificationQuestions
                .map((q, i) => `Q: ${q}\nA: ${answers[i] || t('clarification_not_answered')}`)
                .join('\n\n');
            enrichedPatientData.additionalInfo = `${patientData.additionalInfo || ''}\n\n--- ${t('clarification_additional_qa')} ---\n${qaString}`.trim();
        }
        setPatientData(enrichedPatientData);
        
        setAppView('team_recommendation');
        setIsProcessing(true);
        setStatusMessage(t('team_recommendation_creating'));
        try {
            const team = await aiService.recommendSpecialists(enrichedPatientData, language);
            setRecommendedTeam(team.recommendations);
        } catch (e) {
            setError(t('team_recommendation_auto_error'));
            const allSpecialists = Object.values(AIModel).filter(m => m !== AIModel.SYSTEM);
            const fallbackTeam = allSpecialists.map(model => ({ model, reason: t('team_recommendation_fallback_reason') }));
            setRecommendedTeam(fallbackTeam);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTeamConfirmation = async (confirmedTeam: AIModel[]) => {
        if (!patientData) return;
        setSelectedSpecialists(confirmedTeam);
        setAppView('live_analysis');
        setIsProcessing(true);
        try {
            setStatusMessage(t('ddx_generating'));
            const diagnoses = await aiService.generateInitialDiagnoses(patientData, language);
            setDifferentialDiagnoses(diagnoses);
            setStatusMessage(t('ddx_feedback_prompt'));
        } catch (e) { 
            setError(t('ddx_generation_error'));
            setStatusMessage(t('error_try_again'));
        } 
        finally { setIsProcessing(false); }
    };

    const handleStartDebate = () => {
        if (!patientData || !differentialDiagnoses.length) return;
        
        let enrichedPatientData = { ...patientData, userDiagnosisFeedback: diagnosisFeedback };
        setPatientData(enrichedPatientData);
        setIsProcessing(true);
        setStatusMessage(t('debate_start_status'));
        
        const getUserInterventionCallback = () => {
            const intervention = userInterventionRef.current;
            userInterventionRef.current = null; // Consume it
            setUserIntervention(null);
            return intervention;
        };
        
        aiService.runCouncilDebate(enrichedPatientData, differentialDiagnoses, selectedSpecialists, handleProgress, getUserInterventionCallback, language);
    };
    
    const handleDiagnosisFeedback = (name: string, feedback: DiagnosisFeedback) => {
        setDiagnosisFeedback(prev => {
            if (prev[name] === feedback) {
                const newState = { ...prev };
                delete newState[name];
                return newState;
            }
            return { ...prev, [name]: feedback };
        });
    };

    const handleUserIntervention = (intervention: string) => {
        userInterventionRef.current = intervention;
        if(socraticQuestion) {
            setSocraticQuestion(null);
        } else {
            setDebateHistory(prev => [...prev, { id: `user-${Date.now()}`, author: AIModel.SYSTEM, content: t('user_intervention_log', { intervention }), isUserIntervention: true }]);
        }
    };
    
    const handleRunScenario = async (scenario: string): Promise<FinalReport | null> => {
        if (!patientData || !debateHistory.length) return null;
        try {
            const result = await aiService.runScenarioAnalysis(patientData, debateHistory, scenario, language);
            return result;
        } catch (e) {
            setError(t('scenario_analysis_error'));
            return null;
        }
    };

    const handleExplainRationale = (message: ChatMessage) => setRationaleMessage(message);
    const handleInjectHypothesis = (hypothesis: Diagnosis) => {
        setDifferentialDiagnoses(prev => [...prev, hypothesis]);
        setDiagnosisFeedback(prev => ({ ...prev, [hypothesis.name]: 'injected-hypothesis' }));
    };
    
    const handleUpdateReport = async (updatedReport: Partial<FinalReport>) => {
        if (!currentAnalysisRecord || !currentUser) return;

        const newFinalReport = { ...currentAnalysisRecord.finalReport, ...updatedReport };
        setFinalReport(newFinalReport);

        const updatedRecord = { ...currentAnalysisRecord, finalReport: newFinalReport as FinalReport };
        setCurrentAnalysisRecord(updatedRecord);
        setUserHistory(userHistory.map(r => r.id === updatedRecord.id ? updatedRecord : r));

        try {
            await apiService.analyses.update(updatedRecord.id, { final_report: newFinalReport });
        } catch {
            // keep optimistic UI; optionally show toast in future
        }
    };

    const viewHistoryItem = (record: AnalysisRecord) => {
        setAppView('view_history_item');
        // If we only have list summary fields, fetch full detail
        const needsFetch = !(record as any).debateHistory || !(record as any).finalReport || !(record as any).patientData || Array.isArray((record as any).debateHistory) && (record as any).debateHistory.length === 0;
        if (needsFetch) {
            (async () => {
                try {
                    const full = await apiService.analyses.get(record.id);
                    const detailed = mapFromDetail(full);
                    setCurrentAnalysisRecord(detailed);
                } catch {
                    // fallback to whatever we have
                    setCurrentAnalysisRecord(record);
                }
            })();
        } else {
            setCurrentAnalysisRecord(record);
        }
    };

    const NavButton: React.FC<{ view: AppView; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => {
        const analysisViews: AppView[] = ['new_analysis', 'clarification', 'team_recommendation', 'live_analysis'];
        const historyViews: AppView[] = ['history', 'view_history_item', 'case_library'];

        let isActive = false;
        if (analysisViews.includes(view)) {
            isActive = analysisViews.includes(appView);
        } else if (historyViews.includes(view)) {
            isActive = historyViews.includes(appView);
        } else {
            isActive = appView === view;
        }

        return (
            <button
                onClick={() => handleNavigation(view)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-slate-200 text-text-primary' : 'text-text-secondary hover:bg-slate-100'}`}
            >
                {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
                <span>{label}</span>
            </button>
        );
    };

    const renderMainContent = () => {
        switch (appView) {
            case 'dashboard':
                return <Dashboard userName={currentUser!.name} onNewAnalysis={() => handleNavigation('new_analysis')} onViewHistory={() => setAppView('history')} onOpenTools={() => setAppView('tools')} recentAnalyses={userHistory.slice(0, 5)} onSelectAnalysis={viewHistoryItem} stats={dashboardStats} cmeTopics={cmeTopics} />;
            case 'new_analysis':
                return <div className="max-w-4xl mx-auto"><DataInputForm onSubmit={handleDataSubmit} isAnalyzing={isProcessing} /></div>;
            case 'clarification':
                return <div className="max-w-3xl mx-auto"><ClarificationView isGenerating={isProcessing} questions={clarificationQuestions} onSubmit={handleClarificationSubmit} statusMessage={statusMessage} error={error} /></div>;
            case 'team_recommendation':
                return <div className="max-w-3xl mx-auto"><TeamRecommendationView isProcessing={isProcessing} recommendations={recommendedTeam} onConfirm={handleTeamConfirmation} /></div>
            case 'live_analysis':
            case 'view_history_item':
                const record = appView === 'live_analysis' ? { patientData, debateHistory, finalReport, selectedSpecialists } : currentAnalysisRecord;
                if (!record || !record.patientData) return <div>{t('error_no_data_found')}</div>;
                return <AnalysisView 
                    record={record} 
                    isLive={appView === 'live_analysis'} 
                    statusMessage={statusMessage} 
                    isAnalyzing={isProcessing} 
                    differentialDiagnoses={differentialDiagnoses} 
                    error={error} 
                    onDiagnosisFeedback={handleDiagnosisFeedback} 
                    diagnosisFeedback={diagnosisFeedback} 
                    onStartDebate={handleStartDebate} 
                    onInjectHypothesis={handleInjectHypothesis} 
                    onUserIntervention={handleUserIntervention} 
                    userIntervention={userIntervention} 
                    onExplainRationale={handleExplainRationale} 
                    onGoToEducation={() => setAppView('patient_education')}
                    socraticQuestion={socraticQuestion}
                    livePrognosis={livePrognosis}
                    onRunScenario={handleRunScenario}
                    onUpdateReport={handleUpdateReport}
                />;
            case 'history':
                return <HistoryView analyses={userHistory} onSelectAnalysis={viewHistoryItem} onStartConsultation={() => {}} onViewCaseLibrary={() => setAppView('case_library')} />;
            case 'case_library':
                return <CaseLibraryView onBack={() => setAppView('history')} />;
            case 'patient_education':
                 return currentAnalysisRecord && <PatientEducationPortal record={currentAnalysisRecord} onBack={() => setAppView('view_history_item')} />;
            case 'tools': return <ToolsDashboard />;
            case 'research': return <ResearchView />;
            default: return <div>{t('error_page_not_found')}</div>;
        }
    };
    
    if (!currentUser) return <AuthPage onLoginSuccess={handleLoginSuccess} />;
    
    return (
        <div className="min-h-screen w-full font-sans text-text-primary bg-bg-color pb-24 md:pb-0">
            {criticalFinding && <CriticalFindingAlert finding={criticalFinding} onClose={() => setCriticalFinding(null)} />}
            {rationaleMessage && <RationaleModal message={rationaleMessage} patientData={patientData!} debateHistory={debateHistory} onClose={() => setRationaleMessage(null)} />}
            
            <header className="bg-panel-bg/80 backdrop-blur-lg border-b border-border-color sticky top-0 z-20 hidden md:flex">
                 <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                             <h1 className="text-xl font-bold tracking-tighter uppercase text-transparent bg-clip-text animated-gradient-text">{t('appName')}</h1>
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-lg border border-border-color">
                            <NavButton view="dashboard" label={t('nav_dashboard')} icon={<HomeIcon />} />
                            <NavButton view="new_analysis" label={t('nav_new_case')} icon={<PlusCircleIcon />} />
                            <NavButton view="history" label={t('nav_archive')} icon={<DocumentReportIcon />} />
                            <NavButton view="tools" label={t('nav_tools')} icon={<ToolboxIcon />} />
                            <NavButton view="research" label={t('nav_research')} icon={<LightBulbIcon />} />
                        </div>
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher language={language} onLanguageChange={setLanguage as (lang: Language) => void} />
                            <button className="p-2 rounded-full hover:bg-slate-200/50">
                               <BellIcon className="w-6 h-6 text-slate-500" />
                            </button>
                            <button onClick={handleLogout} className="text-sm font-semibold text-text-secondary hover:text-text-primary">{t('logout')}</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
               {renderMainContent()}
            </main>
            
            <footer className="w-full text-xs text-text-secondary py-5 px-4 mt-12">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                        <CopyrightIcon className="w-4 h-4 text-slate-400" />
                        <span>© {new Date().getFullYear()} {t('appName')}. {t('footer_creator')}:</span>
                        <span className="font-semibold text-slate-600">CDCgroup</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SupportIcon className="w-4 h-4 text-slate-400" />
                        <span>{t('footer_support')}:</span>
                        <span className="font-semibold text-slate-600">CraDev Company</span>
                        <span className="text-slate-300">|</span>
                        <a href="tel:+998947430912" className="font-semibold text-slate-600 hover:text-accent-color-blue transition-colors flex items-center gap-1">
                            +998 94 743 09 12
                        </a>
                    </div>
                </div>
            </footer>
            
            <MobileNavBar activeView={appView} onNavigate={handleNavigation as (view: 'dashboard' | 'new_analysis' | 'history' | 'research' | 'tools') => void} />
        </div>
    );
};

const App: React.FC = () => (
    <AppContent />
);

export default App;