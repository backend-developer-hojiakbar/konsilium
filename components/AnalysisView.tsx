
import React, { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType, FinalReport, PatientData, AnalysisRecord } from '../types';
import ChatMessage from './ChatMessage';
import FinalReportCard from './FinalReportCard';
import FollowUpAnalysis from './FollowUpAnalysis';
import DownloadIcon from './icons/DownloadIcon';
import RestartIcon from './icons/RestartIcon';
import { generatePdfReport } from '../services/pdfGenerator';

interface AnalysisViewProps {
    analysisRecord: Partial<AnalysisRecord>; // Can be a live analysis or a historical one
    statusMessage?: string;
    error?: string | null;
    onFollowUpSubmit?: (question: string) => void;
    isAskingFollowUp?: boolean;
    onNewAnalysis: () => void;
    isFollowUpFinalized?: boolean;
    onFinalizeFollowUp?: () => void;
    isLive: boolean; // Flag to distinguish live from historical
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ 
    analysisRecord,
    statusMessage, 
    error, 
    onFollowUpSubmit, 
    isAskingFollowUp = false, 
    onNewAnalysis,
    isFollowUpFinalized = true, // Default to finalized for history view
    onFinalizeFollowUp,
    isLive,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const { patientData, debateHistory = [], finalReport, followUpHistory = [] } = analysisRecord;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [debateHistory, statusMessage, followUpHistory]);

    const handleDownloadPdf = () => {
        if (finalReport && patientData) {
            generatePdfReport(finalReport, patientData, followUpHistory);
        }
    };

    return (
        <div className="animated-gradient-border mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="content-wrapper p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Munozara Stenogrammasi</h2>
                        <p className="text-text-secondary">Bu yerda raqamli ekspertlarning "fikrlash" zanjirini va qaror qabul qilish mantig'ini kuzatishingiz mumkin.</p>
                    </div>
                    
                    <div className="flex items-center gap-2 print-button flex-shrink-0">
                        <button onClick={onNewAnalysis} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-200">
                            <RestartIcon className="w-5 h-5" />
                            <span>Yangi tahlil</span>
                        </button>
                        {finalReport && (
                             <button onClick={handleDownloadPdf} className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors border border-blue-700 shadow-sm">
                                <DownloadIcon className="w-5 h-5" />
                                <span>PDF</span>
                            </button>
                        )}
                    </div>
                </div>

                <div 
                    ref={scrollRef} 
                    className="max-h-[60vh] overflow-y-auto pr-4 -mr-4"
                >
                    {debateHistory.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                    
                    {isLive && statusMessage && !finalReport && !error && (
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

                {finalReport && (
                    <>
                        <FinalReportCard report={finalReport} />
                         <FollowUpAnalysis 
                            onSubmit={onFollowUpSubmit!}
                            isAnalyzing={isAskingFollowUp}
                            followUpHistory={followUpHistory}
                            isFinalized={isLive ? isFollowUpFinalized : true}
                            onFinalize={onFinalizeFollowUp!}
                            isLive={isLive}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalysisView;
