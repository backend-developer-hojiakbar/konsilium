
import React from 'react';
import type { AnalysisRecord } from '../types';
import AdBanner from './AdBanner';
import DocumentReportIcon from './icons/DocumentReportIcon';


interface HistoryViewProps {
    analyses: AnalysisRecord[];
    onSelectAnalysis: (record: AnalysisRecord) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ analyses, onSelectAnalysis }) => {
    if (analyses.length === 0) {
        return (
            <div className="glass-panel p-8 text-center animate-fade-in-up">
                <DocumentReportIcon className="w-12 h-12 mx-auto text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-700">Tahlillar Tarixi Bo'sh</h3>
                <p className="mt-1 text-sm text-slate-500">Siz hali bironta ham klinik tahlil o'tkazmadingiz.</p>
                <p className="mt-1 text-sm text-slate-500">Boshlash uchun "Yangi Tahlil" tugmasini bosing.</p>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in-up space-y-6">
             <div className="text-left mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Tahlillar Tarixi</h2>
                <p className="text-text-secondary">O'tkazilgan barcha tahlillaringiz ro'yxati.</p>
            </div>
            
            <div className="space-y-4">
                {analyses.map((record, index) => (
                    <React.Fragment key={record.id}>
                        <div 
                            onClick={() => onSelectAnalysis(record)}
                            className="glass-panel p-4 rounded-xl hover:shadow-lg hover:border-blue-500 transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex justify-between items-center gap-4">
                                <div className="min-w-0">
                                     <p className="font-bold text-slate-800 truncate" title={`${record.patientData.firstName} ${record.patientData.lastName}`}>
                                        {record.patientData.firstName} {record.patientData.lastName}
                                    </p>
                                    <p className="text-sm text-slate-600 truncate" title={record.finalReport.consensusDiagnosis[0]?.name}>
                                        {record.finalReport.consensusDiagnosis[0]?.name || "Noma'lum tashxis"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {new Date(record.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                     <span className="text-lg font-bold text-green-600">
                                         {record.finalReport.consensusDiagnosis[0]?.probability || 'N/A'}%
                                     </span>
                                     <p className="text-xs text-slate-400">ehtimollik</p>
                                </div>
                            </div>
                        </div>
                         {(index + 1) % 4 === 0 && (
                            <AdBanner title="Farmatsevtika yangiliklari" description="Eng so'nggi dori vositalari va ularning samaradorligi haqida bilib oling." slim={true} />
                         )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default HistoryView;