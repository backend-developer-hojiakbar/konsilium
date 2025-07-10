

import React from 'react';
import type { FinalReport } from '../types';
import PillIcon from './icons/PillIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import ShieldWarningIcon from './icons/ShieldWarningIcon';

// Icons for the report sections
const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BeakerIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);


const Section: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="relative">
        <div className="flex items-center gap-4">
            {icon}
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <div className="mt-3 pl-11 space-y-3 text-slate-600 border-l-2 border-slate-200 ml-3.5">
            <div className="pl-6">
                {children}
            </div>
        </div>
    </div>
);


const FinalReportCard: React.FC<{ report: FinalReport }> = ({ report }) => {
    return (
        <div className="animate-fade-in-up mt-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text animated-gradient-text mb-6 pb-4 border-b-2 border-slate-200">
                Yakuniy Xulosa: Konsilium Konsensusi
            </h2>
            <div className="space-y-10">
                <Section title="Eng Ehtimolli Tashxis(lar)" icon={<CheckCircleIcon />}>
                    {report.consensusDiagnosis.length > 0 ? (
                        report.consensusDiagnosis.map((diag, index) => (
                            <div key={index} className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 shadow-sm space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                    <p className="font-bold text-slate-800 flex-1">{diag.name}</p>
                                    <span className="text-lg font-bold text-green-600 flex-shrink-0">{diag.probability}%</span>
                                </div>
                                
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-500 h-2 rounded-full" 
                                        style={{ width: `${diag.probability}%` }}
                                        title={`${diag.probability}% ehtimollik`}
                                    ></div>
                                </div>

                                {diag.evidenceLevel && (
                                     <div className="p-2 bg-slate-100 border-l-4 border-slate-300 rounded-r-md">
                                        <p className="text-xs text-slate-600"><span className="font-bold">Dalil:</span> {diag.evidenceLevel}</p>
                                    </div>
                                )}
                                
                                <p className="text-sm text-slate-700">{diag.justification}</p>
                            </div>
                        ))
                    ) : <p>Aniq konsensusga kelinmadi.</p>}
                </Section>
                
                <Section title="Tavsiya Etilgan Davolash Rejasi" icon={<ClipboardListIcon />}>
                     {report.treatmentPlan.length > 0 ? (
                        <ul className="list-disc list-inside space-y-2 marker:text-blue-600">
                            {report.treatmentPlan.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ul>
                     ) : <p>Maxsus davolash rejasi tavsiya etilmagan.</p>}
                </Section>
                
                <Section title="Dori-Darmonlar bo'yicha Tavsiyalar" icon={<PillIcon />}>
                    {report.medicationRecommendations.length > 0 ? (
                        <div className="space-y-3">
                            {report.medicationRecommendations.map((med, index) => (
                                <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="font-semibold text-slate-800">{med.name}</p>
                                    <p className="text-sm text-slate-600"><span className="font-medium">Doza:</span> {med.dosage}</p>
                                    <p className="text-sm text-slate-500"><span className="font-medium">Izoh:</span> {med.notes}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p>Maxsus dori-darmonlar tavsiya etilmagan.</p>}
                </Section>
                
                {report.pharmacologicalWarnings && report.pharmacologicalWarnings.length > 0 && (
                     <Section title="Farmakologik Ogohlantirishlar" icon={<ShieldWarningIcon />}>
                        <div className="space-y-3">
                            {report.pharmacologicalWarnings.map((warning, index) => (
                                <div key={index} className="p-3 bg-red-50/70 rounded-lg border border-red-200">
                                    <p className="font-semibold text-red-800">{warning.name}</p>
                                    <p className="text-sm text-red-700">{warning.warning}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}
                
                {report.unexpectedFindings && (
                    <Section title="Kutilmagan Bog'liqliklar va Gipotezalar" icon={<BrainCircuitIcon />}>
                        <p className="italic text-slate-600 bg-teal-50/50 p-4 rounded-lg border border-teal-100">{report.unexpectedFindings}</p>
                    </Section>
                )}

                <Section title="Inkor Etilgan Gipotezalar" icon={<XCircleIcon />}>
                     {report.rejectedHypotheses.length > 0 ? (
                        <div className="space-y-2">
                            {report.rejectedHypotheses.map((hyp, index) => (
                                <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="font-semibold text-slate-700">{hyp.name}</p>
                                    <p className="text-sm text-slate-500"><span className="font-medium text-slate-600">Sabab:</span> {hyp.reason}</p>
                                </div>
                            ))}
                        </div>
                     ) : <p>Munozarada gipotezalar inkor etilmadi.</p>}
                </Section>

                <Section title="Tavsiya Etiladigan Qo'shimcha Tekshiruvlar" icon={<BeakerIcon />}>
                     {report.recommendedTests.length > 0 ? (
                        <ul className="list-disc list-inside space-y-2 marker:text-blue-600">
                            {report.recommendedTests.map((test, index) => (
                                <li key={index}>{test}</li>
                            ))}
                        </ul>
                     ) : <p>Qo'shimcha tekshiruvlar tavsiya etilmagan.</p>}
                </Section>
            </div>
        </div>
    );
};

export default FinalReportCard;