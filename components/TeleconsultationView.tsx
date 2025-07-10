import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType, ResearchReport, ResearchProgressUpdate } from '../types';
import { runResearchCouncilDebate } from '../services/aiCouncilService';
import SpinnerIcon from './icons/SpinnerIcon';
import ChatMessage from './ChatMessage';
import ResearchReportCard from './ResearchReportCard';
import LightBulbIcon from './icons/LightBulbIcon';
import RestartIcon from './icons/RestartIcon';

const TeleconsultationView: React.FC = () => {
    const [diseaseName, setDiseaseName] = useState('Idiopatik o\'pka fibrozi');
    const [isSearching, setIsSearching] = useState(false);
    const [debateHistory, setDebateHistory] = useState<ChatMessageType[]>([]);
    const [report, setReport] = useState<ResearchReport | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [debateHistory, statusMessage]);


    const resetState = () => {
        setIsSearching(false);
        setDebateHistory([]);
        setReport(null);
        setStatusMessage('');
        setError(null);
    };

    const handleProgress = useCallback((update: ResearchProgressUpdate) => {
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
                    }
                    return [...prev, update.message];
                });
                break;
            case 'report':
                setReport(update.data);
                setIsSearching(false);
                setStatusMessage('');
                break;
            case 'error':
                setError(update.message);
                setIsSearching(false);
                setStatusMessage('Tadqiqot xatolik bilan yakunlandi.');
                break;
        }
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diseaseName.trim()) return;
        
        resetState();
        setIsSearching(true);
        await runResearchCouncilDebate(diseaseName, handleProgress);
    };

    if (isSearching || report) {
        return (
            <div className="animated-gradient-border mt-10 animate-fade-in-up">
                 <div className="content-wrapper p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">
                                Tadqiqot Munozarasi: "{report?.diseaseName || diseaseName}"
                            </h2>
                            <p className="text-text-secondary">Innovatsion davolash usullari bo'yicha ekspertlar muhokamasi.</p>
                        </div>
                        {report && (
                             <button onClick={resetState} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-200">
                                <RestartIcon className="w-5 h-5" />
                                <span>Yangi tadqiqot</span>
                            </button>
                        )}
                    </div>
                     <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                        {debateHistory.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                        
                        {statusMessage && !report && !error && (
                            <div className="text-center py-4 text-blue-600 font-semibold animate-pulse">
                               {statusMessage}
                            </div>
                        )}

                        {error && (
                            <div className="p-4 my-4 text-sm text-red-700 rounded-lg bg-red-100 border border-red-300" role="alert">
                              <span className="font-bold">Xatolik!</span> {error}
                            </div>
                        )}
                    </div>

                    {report && <ResearchReportCard report={report} />}
                 </div>
            </div>
        );
    }

    return (
        <div className="glass-panel animate-fade-in-up p-6 md:p-8">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <LightBulbIcon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-800">Tadqiqot Markazi</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                    Davolash usuli murakkab bo'lgan kasallik nomini kiriting. Kengashimiz ushbu kasallik uchun innovatsion va eksperimental davo choralarini muhokama qiladi.
                </p>
            </div>
            <form onSubmit={handleSearch} className="mt-8 max-w-lg mx-auto">
                <div>
                    <label htmlFor="diseaseName" className="block text-sm font-medium text-text-secondary mb-2">
                        Kasallik nomi
                    </label>
                    <input
                        type="text"
                        id="diseaseName"
                        value={diseaseName}
                        onChange={(e) => setDiseaseName(e.target.value)}
                        className="block w-full rounded-md sm:text-sm common-input focus:border-accent-color focus:ring focus:ring-blue-500/30 placeholder-slate-400 transition shadow-sm px-4 py-3"
                        placeholder="Masalan: Pankreatik saraton"
                    />
                </div>
                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={isSearching || !diseaseName.trim()}
                        className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-bold animated-gradient-button hover:saturate-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-slate-500 disabled:opacity-70 transition-all duration-300 transform hover:scale-105"
                    >
                        {isSearching ? (
                            <>
                                <SpinnerIcon className="w-5 h-5" />
                                Izlanilmoqda...
                            </>
                        ) : (
                            "Tadqiqotni Boshlash"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TeleconsultationView;