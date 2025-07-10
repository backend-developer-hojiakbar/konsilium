
import React from 'react';
import type { ResearchReport } from '../types';
import LightBulbIcon from './icons/LightBulbIcon';
import GlobeIcon from './icons/GlobeIcon';

const Section: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="relative mt-8">
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

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
     </svg>
);

const ForwardIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DocumentTextIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


const ResearchReportCard: React.FC<{ report: ResearchReport }> = ({ report }) => {
    return (
        <div className="animate-fade-in-up mt-8">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text animated-gradient-text mb-6 pb-4 border-b-2 border-slate-200">
                Tadqiqot Hisoboti: {report.diseaseName}
            </h2>
            <div className="space-y-6">
                 <Section title="Umumiy Xulosa" icon={<DocumentTextIcon />}>
                    <p className="text-base">{report.summary}</p>
                 </Section>

                <Section title="Potensial Davolash Strategiyalari" icon={<LightBulbIcon className="h-7 w-7 text-blue-600" />}>
                    {report.potentialStrategies.length > 0 ? (
                        <div className="space-y-6">
                            {report.potentialStrategies.map((strategy, index) => (
                                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-lg text-slate-800">{strategy.name}</h4>
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <h5 className="font-semibold text-sm text-slate-600">Ta'sir Mexanizmi:</h5>
                                            <p className="text-sm">{strategy.mechanism}</p>
                                        </div>
                                         <div>
                                            <h5 className="font-semibold text-sm text-slate-600">Dalillar darajasi:</h5>
                                            <p className="text-sm italic text-slate-500">{strategy.evidence}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="font-semibold text-sm text-green-700 flex items-center gap-2"><CheckIcon /> Afzalliklari:</h5>
                                                <ul className="list-disc list-inside space-y-1 mt-1 text-sm marker:text-green-500">
                                                    {strategy.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                                </ul>
                                            </div>
                                             <div>
                                                <h5 className="font-semibold text-sm text-red-700 flex items-center gap-2"><XIcon /> Kamchiliklari:</h5>
                                                 <ul className="list-disc list-inside space-y-1 mt-1 text-sm marker:text-red-500">
                                                    {strategy.cons.map((con, i) => <li key={i}>{con}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p>Potensial strategiyalar topilmadi.</p>}
                </Section>
                
                <Section title="Keyingi Qadamlar" icon={<ForwardIcon />}>
                     {report.nextSteps.length > 0 ? (
                        <ul className="list-disc list-inside space-y-2 marker:text-indigo-600">
                            {report.nextSteps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ul>
                     ) : <p>Keyingi qadamlar bo'yicha tavsiyalar yo'q.</p>}
                </Section>
                
                 {report.sources && report.sources.length > 0 && (
                    <Section title="Ma'lumot Manbalari" icon={<GlobeIcon />}>
                        <ul className="space-y-2">
                            {report.sources.map((source, index) => (
                                <li key={index} className="text-sm truncate">
                                    <a 
                                        href={source.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors break-words"
                                        title={source.title}
                                    >
                                        - {source.title || source.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Section>
                 )}
            </div>
        </div>
    );
};

export default ResearchReportCard;
