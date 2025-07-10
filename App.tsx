

import React, { useState, useCallback, useEffect } from 'react';
import type { PatientData, ChatMessage, FinalReport, ProgressUpdate, User, AnalysisRecord } from './types';
import { runAICouncilDebate, askFollowUpQuestion, generateClarifyingQuestions } from './services/aiCouncilService';
import * as authService from './services/authService';

import AuthPage from './components/AuthPage';
import DataInputForm from './components/DataInputForm';
import AnalysisView from './components/AnalysisView';
import ClarificationStep from './components/FileAnalyzer';
import TeleconsultationView from './components/TeleconsultationView';
import HistoryView from './components/HistoryView';
import AdBanner from './components/AdBanner';
import MobileNavBar from './components/MobileNavBar';

import LightBulbIcon from './components/icons/LightBulbIcon';
import PlusCircleIcon from './components/icons/PlusCircleIcon';
import DocumentReportIcon from './components/icons/DocumentReportIcon';

type AppView = 'new_analysis' | 'clarification' | 'live_analysis' | 'history' | 'view_history_item' | 'research';

const App: React.FC = () => {
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userCount, setUserCount] = useState(0);

    // View State
    const [appView, setAppView] =useState<AppView>('new_analysis');

    // Data State for a single analysis (live or historical)
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [debateHistory, setDebateHistory] = useState<ChatMessage[]>([]);
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [followUpHistory, setFollowUpHistory] = useState<{question: string, answer: string}[]>([]);
    
    // State for the analysis process
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
    const [isFollowUpFinalized, setIsFollowUpFinalized] = useState(false);
    
    // State for clarification step
    const [clarifyingQuestions, setClarifyingQuestions] = useState<string[] | null>(null);

    // History State
    const [userHistory, setUserHistory] = useState<AnalysisRecord[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<AnalysisRecord | null>(null);


    // --- AUTH & INITIALIZATION ---
    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            handleLoginSuccess(user);
        }
        setUserCount(authService.getUserCount());
    }, []);
    
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        const history = authService.getAnalyses(user.phone);
        setUserHistory(history);
        setUserCount(authService.getUserCount());
        setAppView('new_analysis');
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
        resetAnalysisState();
    };
    
    const handleNavigation = (view: AppView) => {
        if (view === 'new_analysis') {
            resetAnalysisState();
        } else {
            setAppView(view);
        }
    };

    // --- STATE MANAGEMENT ---
    const resetAnalysisState = () => {
        setPatientData(null);
        setDebateHistory([]);
        setFinalReport(null);
        setFollowUpHistory([]);
        setIsAnalyzing(false);
        setError(null);
        setStatusMessage('');
        setIsFollowUpFinalized(false);
        setClarifyingQuestions(null);
        setSelectedHistoryItem(null);
        setAppView('new_analysis');
    };

    // --- ANALYSIS PROGRESS & COMPLETION ---
    const handleProgress = useCallback((update: ProgressUpdate) => {
        // This function can be called even after the component has started a new analysis
        // A check on patientData can help ensure we're updating the correct session.
        // For this app's simplicity, we assume one analysis at a time.
        
        switch (update.type) {
            case 'status':
                setStatusMessage(update.message);
                break;
            case 'message':
                 setDebateHistory(prev => {
                    const thinkingIndex = prev.findIndex(m => m.author === update.message.author && m.isThinking);
                    if (thinkingIndex > -1) {
                        const newHistory = [...prev];
                        newHistory[thinkingIndex] = update.message;
                        return newHistory;
                    } else {
                        return [...prev, update.message];
                    }
                });
                break;
            case 'report':
                setFinalReport(update.data);
                setIsAnalyzing(false);
                setStatusMessage('Tahlil yakunlandi.');
                
                // Automatically save the completed analysis
                if (currentUser && patientData) {
                    // We capture the state at this moment for saving.
                    setDebateHistory(currentDebateHistory => {
                         const newRecord: AnalysisRecord = {
                            id: new Date().toISOString(),
                            date: new Date().toISOString(),
                            patientData: patientData,
                            debateHistory: currentDebateHistory,
                            finalReport: update.data,
                            followUpHistory: [] // Start with empty, will be saved on finalize
                        };
                        authService.saveAnalysis(currentUser.phone, newRecord);
                        setUserHistory(authService.getAnalyses(currentUser.phone));
                        return currentDebateHistory;
                    });
                }
                break;
             case 'error':
                setError(update.message);
                setIsAnalyzing(false);
                setStatusMessage('Tahlil xatolik bilan yakunlandi.');
                break;
        }
    }, [currentUser, patientData]); // Removed dependencies that cause re-creation of function

    // --- DATA SUBMISSION & DEBATE START ---
    const handleDataSubmit = async (data: PatientData) => {
        resetAnalysisState();
        setPatientData(data);
        setStatusMessage("Konsilium uchun qo'shimcha savollar shakllantirilmoqda...");
        setAppView('clarification');
        try {
            const questions = await generateClarifyingQuestions(data);
            if (questions && questions.length > 0) {
                setClarifyingQuestions(questions);
            } else {
                await handleStartDebate([], data);
            }
        } catch (e) {
            setError("Aniqlashtiruvchi savollarni olishda xatolik yuz berdi. Tahlilni mavjud ma'lumotlar bilan boshlaymiz.");
            console.error(e);
            await handleStartDebate([], data);
        }
    };

    const handleStartDebate = async (answers: string[], initialData?: PatientData) => {
        const dataToUse = initialData || patientData;
        if (!dataToUse) return;

        let additionalInfo = '';
        if (clarifyingQuestions && answers.length > 0) {
            additionalInfo = answers.map((answer, index) => 
                `Savol: ${clarifyingQuestions[index]}\nJavob: ${answer || 'Javob berilmagan'}`
            ).join('\n\n');
        }
        
        const enrichedPatientData: PatientData = {
            ...dataToUse,
            additionalInfo: (dataToUse.additionalInfo || '') + '\n' + additionalInfo,
        };

        setPatientData(enrichedPatientData);
        setClarifyingQuestions(null);
        setIsAnalyzing(true);
        setAppView('live_analysis');
        
        runAICouncilDebate(enrichedPatientData, handleProgress);
    };
    
    // --- FOLLOW-UP & HISTORY VIEW ---
    const handleFollowUpSubmit = async (question: string) => {
        setIsAskingFollowUp(true);
        try {
            const answer = await askFollowUpQuestion(debateHistory, question);
            setFollowUpHistory(prev => [...prev, { question, answer }]);
        } catch(err) {
            const errorAnswer = err instanceof Error ? err.message : "Noma'lum xatolik";
            setFollowUpHistory(prev => [...prev, { question, answer: `Javob olishda xatolik: ${errorAnswer}` }]);
        } finally {
            setIsAskingFollowUp(false);
        }
    };
    
    const viewHistoryItem = (record: AnalysisRecord) => {
        setSelectedHistoryItem(record);
        setAppView('view_history_item');
    };

    // --- RENDER LOGIC ---
    if (!currentUser) {
        return <AuthPage onLoginSuccess={handleLoginSuccess} />;
    }

    const renderContent = () => {
        switch (appView) {
            case 'new_analysis':
                return <DataInputForm onSubmit={handleDataSubmit} isAnalyzing={isAnalyzing} />;
            case 'clarification':
                return <ClarificationStep
                    isGenerating={!clarifyingQuestions && !error}
                    questions={clarifyingQuestions}
                    onSubmit={(answers) => handleStartDebate(answers)}
                    statusMessage={statusMessage}
                    error={error}
                />;
            case 'live_analysis':
                return <AnalysisView 
                    analysisRecord={{ patientData, debateHistory, finalReport, followUpHistory }}
                    statusMessage={statusMessage}
                    error={error}
                    onFollowUpSubmit={handleFollowUpSubmit}
                    isAskingFollowUp={isAskingFollowUp}
                    onNewAnalysis={resetAnalysisState}
                    isFollowUpFinalized={isFollowUpFinalized}
                    onFinalizeFollowUp={() => setIsFollowUpFinalized(true)}
                    isLive={true}
                />;
            case 'history':
                return <HistoryView analyses={userHistory} onSelectAnalysis={viewHistoryItem} />;
            case 'view_history_item':
                return selectedHistoryItem && <AnalysisView 
                    analysisRecord={selectedHistoryItem}
                    onNewAnalysis={resetAnalysisState}
                    isLive={false}
                />;
            case 'research':
                return <TeleconsultationView />;
            default:
                return <DataInputForm onSubmit={handleDataSubmit} isAnalyzing={isAnalyzing} />;
        }
    };

    const NavButton: React.FC<{ view: AppView; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
        <button
            onClick={() => handleNavigation(view)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-blue-500 ${appView.startsWith(view.split('_')[0]) ? 'bg-white text-blue-600 shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen w-full font-sans text-text-primary bg-slate-50 pb-24 md:pb-0">
            <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                             <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text animated-gradient-text">
                                KONSILIUM
                            </h1>
                        </div>
                        <nav className="hidden md:flex items-center gap-2 p-1 bg-slate-200/60 rounded-xl">
                           <NavButton view="new_analysis" label="Yangi Tahlil" icon={<PlusCircleIcon className="w-5 h-5"/>} />
                           <NavButton view="history" label="Tarix" icon={<DocumentReportIcon className="w-5 h-5"/>} />
                           <NavButton view="research" label="Tadqiqot" icon={<LightBulbIcon className="w-5 h-5"/>} />
                        </nav>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 hidden md:block">
                                Salom, <span className="font-bold text-slate-700">{currentUser.phone}</span>
                            </span>
                            <button onClick={handleLogout} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                                Chiqish
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col-reverse lg:flex-row gap-8">
                    <main className="flex-1 min-w-0">
                       {renderContent()}
                    </main>
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <AdBanner title="Shifokorlar uchun maxsus taklif" description="Eng so'nggi tibbiy anjumanlar va vebinarlarga yoziling."/>
                        </div>
                    </aside>
                </div>
                 <div className="container mx-auto px-4 mt-12">
                    <AdBanner title="Tibbiy uskunalar" description="Yetakchi brendlardan eng zamonaviy tibbiy jihozlar."/>
                </div>
            </div>

            <footer className="w-full mt-16 py-6 bg-white border-t border-slate-200">
                <div className="container mx-auto px-4 text-center text-slate-500 text-xs">
                    <div className="flex justify-between items-center">
                        <p>Platforma foydalanuvchilari: <span className="font-bold text-slate-700">{userCount}</span></p>
                        <p className="hidden sm:block">© 2025 IBN SINO | BARCHA HUQUQLAR HIMOYALANGAN</p>
                        <p>CraDev & CDCGroup Hamkorligida</p>
                    </div>
                </div>
            </footer>
            
            <MobileNavBar activeView={appView} onNavigate={handleNavigation} />
        </div>
    );
};

export default App;