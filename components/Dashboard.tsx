import React from 'react';
import type { AnalysisRecord, UserStats, CMETopic } from '../types';
import PlusCircleIcon from './icons/PlusCircleIcon';
import DocumentReportIcon from './icons/DocumentReportIcon';
import ToolboxIcon from './icons/ToolboxIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import UserStatsComponent from './dashboard/UserStats';
import CmeSuggestions from './dashboard/CmeSuggestions';
import { useTranslation } from '../hooks/useTranslation';

interface DashboardProps {
    userName: string;
    onNewAnalysis: () => void;
    onViewHistory: () => void;
    onOpenTools: () => void;
    recentAnalyses: AnalysisRecord[];
    onSelectAnalysis: (record: AnalysisRecord) => void;
    stats: UserStats | null;
    cmeTopics: CMETopic[];
}

const DashboardActionCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onClick}
            className="w-full text-left p-6 glass-panel group transition-all duration-300 hover:border-accent-color-blue hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue"
        >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 border border-border-color shadow-inner mb-4 text-accent-color-blue">
                {icon}
            </div>
            <h3 className="font-bold text-lg text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{description}</p>
            <p className="text-sm font-semibold text-accent-color-blue mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {t('dashboard_start')} &rarr;
            </p>
        </button>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ userName, onNewAnalysis, onViewHistory, onOpenTools, recentAnalyses, onSelectAnalysis, stats, cmeTopics }) => {
    const { t } = useTranslation();
    return (
        <div className="animate-fade-in-up space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('dashboard_greeting', { name: userName.split(' ')[0] })}</h1>
                <p className="text-text-secondary mt-1">{t('dashboard_subgreeting')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardActionCard 
                    title={t('dashboard_new_analysis_title')}
                    description={t('dashboard_new_analysis_desc')}
                    icon={<PlusCircleIcon className="w-8 h-8"/>}
                    onClick={onNewAnalysis}
                />
                 <DashboardActionCard 
                    title={t('dashboard_archive_title')} 
                    description={t('dashboard_archive_desc')}
                    icon={<DocumentReportIcon className="w-8 h-8"/>}
                    onClick={onViewHistory}
                />
                 <DashboardActionCard 
                    title={t('dashboard_tools_title')}
                    description={t('dashboard_tools_desc')}
                    icon={<ToolboxIcon className="w-8 h-8"/>}
                    onClick={onOpenTools}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div>
                    <h2 className="text-xl font-bold text-text-primary mb-4">{t('dashboard_stats_title')}</h2>
                    {stats ? <UserStatsComponent stats={stats} /> : <div className="glass-panel p-4 text-center">{t('dashboard_stats_loading')}</div>}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-primary mb-4">{t('dashboard_cme_title')}</h2>
                    {cmeTopics ? <CmeSuggestions topics={cmeTopics} /> : <div className="glass-panel p-4 text-center">{t('dashboard_cme_loading')}</div>}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-text-primary mb-4">{t('dashboard_recent_analyses_title')}</h2>
                <div className="glass-panel p-4 space-y-2">
                    {recentAnalyses.length > 0 ? (
                        recentAnalyses.map(record => (
                            <button 
                                key={record.id} 
                                onClick={() => onSelectAnalysis(record)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-200/50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <UserCircleIcon className="w-10 h-10 text-slate-400 flex-shrink-0"/>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-text-primary truncate">{record.patientData?.firstName || ''} {record.patientData?.lastName || ''}</p>
                                        <p className="text-sm text-text-secondary truncate">{record.finalReport?.consensusDiagnosis?.[0]?.name || t('unknown_diagnosis')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="text-sm text-text-secondary hidden sm:block">
                                        {(() => {
                                            const lang = (typeof window !== 'undefined' && (window as any).__app_language__) || 'uz-L';
                                            const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ';
                                            return new Date(record.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
                                        })()}
                                    </span>
                                    <ChevronRightIcon className="w-5 h-5 text-slate-400"/>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-text-secondary p-4">{t('dashboard_no_recent_analyses')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;