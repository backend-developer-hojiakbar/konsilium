import React from 'react';
import { UserStats } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface UserStatsProps {
    stats: UserStats | null | undefined;
}

const StatItem: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="p-3 bg-slate-100/70 rounded-lg text-center border border-border-color">
        <p className="text-2xl font-bold text-accent-color-blue">{value}</p>
        <p className="text-xs font-semibold text-text-secondary uppercase">{label}</p>
    </div>
);

const UserStatsComponent: React.FC<UserStatsProps> = ({ stats }) => {
    const { t } = useTranslation();
    const safeStats: UserStats = {
        totalAnalyses: stats?.totalAnalyses ?? 0,
        commonDiagnoses: Array.isArray(stats?.commonDiagnoses) ? stats!.commonDiagnoses : [],
        feedbackAccuracy: stats?.feedbackAccuracy ?? 0,
    };
    const common = safeStats.commonDiagnoses || [];
    return (
        <div className="glass-panel p-4 h-full">
            <div className="grid grid-cols-2 gap-3 mb-3">
                <StatItem label={t('stats_total_analyses')} value={safeStats.totalAnalyses} />
                <StatItem label={t('stats_feedback_accuracy')} value={`${Math.round(safeStats.feedbackAccuracy * 100)}%`} />
            </div>
            <div>
                 <h4 className="text-sm font-semibold text-text-secondary mb-2 text-center">{t('stats_top_diagnoses')}</h4>
                 <div className="space-y-2">
                    {common.map((diag, index) => (
                        <div key={index} className="text-sm p-2 bg-slate-100/70 rounded-md flex justify-between">
                            <span className="font-medium text-text-primary truncate">{diag.name}</span>
                            <span className="font-bold">{t('stats_case', { count: diag.count })}</span>
                        </div>
                    ))}
                    {common.length === 0 && <p className="text-xs text-center text-text-secondary">{t('stats_no_data')}</p>}
                 </div>
            </div>
        </div>
    );
};

export default UserStatsComponent;