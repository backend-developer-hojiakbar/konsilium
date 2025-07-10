import React, { useState, useEffect } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';

interface FollowUpAnalysisProps {
    isAnalyzing: boolean;
    onSubmit: (question: string) => void;
    followUpHistory: { question: string, answer: string }[];
    isFinalized: boolean;
    onFinalize: () => void;
    isLive: boolean;
}

const FollowUpAnalysis: React.FC<FollowUpAnalysisProps> = ({ isAnalyzing, onSubmit, followUpHistory, isFinalized, onFinalize, isLive }) => {
    const [question, setQuestion] = useState('');
    const [showFinalizePrompt, setShowFinalizePrompt] = useState(false);
    
    // Using a ref to track the length to avoid re-triggering the effect unnecessarily
    const historyLengthRef = React.useRef(followUpHistory.length);

    useEffect(() => {
        // Show the prompt only when a new answer has been added and it's a live session
        if (isLive && followUpHistory.length > historyLengthRef.current) {
            setShowFinalizePrompt(true);
        }
        historyLengthRef.current = followUpHistory.length;
    }, [followUpHistory, isLive]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isAnalyzing) return;
        onSubmit(question);
        setQuestion('');
        setShowFinalizePrompt(false);
    };

    const handleContinue = () => {
        setShowFinalizePrompt(false);
    };

    const handleFinalize = () => {
        setShowFinalizePrompt(false);
        onFinalize();
    };

    return (
        <div className="mt-8 pt-8 border-t-2 border-slate-200 animate-fade-in-up follow-up-section" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Konsilium bilan Savol-Javob
            </h3>
            
            {followUpHistory.length === 0 && (
                <p className="text-text-secondary mb-6">Yakuniy xulosa bo'yicha aniqlashtiruvchi savollaringiz bo'lsa, bu yerga yozing.</p>
            )}
            
            <div className="space-y-6 mb-6">
                {followUpHistory.map((item, index) => (
                    <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s`}}>
                        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200">
                            <p className="font-semibold text-blue-600">Sizning savolingiz:</p>
                            <p className="mt-1 text-slate-700 whitespace-pre-wrap">{item.question}</p>
                        </div>
                        <div className="mt-2 p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
                            <p className="font-semibold text-slate-800">Konsilium Raisi javobi:</p>
                            <p className="mt-1 text-slate-700 whitespace-pre-wrap">{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {isLive && !isFinalized && (
                showFinalizePrompt ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center animate-fade-in-up">
                        <p className="font-semibold text-slate-800 mb-4">Konsilium Raisi: Yana aniqlashtiruvchi savollaringiz bormi?</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleContinue} className="px-5 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors">
                                Ha, bor
                            </button>
                            <button onClick={handleFinalize} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                Yo'q, rahmat. Yakunlash
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Masalan: Tavsiya etilgan dori qanday ta'sir qiladi?"
                            className="flex-grow block w-full rounded-md sm:text-sm common-input focus:border-accent-color focus:ring focus:ring-blue-500/30 placeholder-slate-400 transition px-4 py-2.5"
                            disabled={isAnalyzing}
                        />
                        <button
                            type="submit"
                            disabled={isAnalyzing || !question.trim()}
                            className="flex justify-center items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg shadow-md text-sm font-bold animated-gradient-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-slate-500 disabled:opacity-70 transition-all duration-300"
                        >
                            {isAnalyzing ? (
                                <>
                                    <SpinnerIcon className="w-4 h-4 text-white" />
                                    So'ralmoqda...
                                </>
                            ) : (
                                "Yuborish"
                            )}
                        </button>
                    </form>
                )
            )}
            
            {isLive && isFinalized && followUpHistory.length > 0 && (
                 <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-fade-in-up">
                    <p className="font-semibold text-green-800">Savol-javob sessiyasi yakunlandi. Yakuniy hisobotni "PDF Yuklab Olish" tugmasi orqali yuklab olishingiz mumkin.</p>
                </div>
            )}
        </div>
    );
};

export default FollowUpAnalysis;