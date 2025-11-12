import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    style?: React.CSSProperties;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, onClick, style }) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onClick}
            style={style}
            className="w-full text-left p-6 glass-panel group transition-all duration-300 hover:border-accent-color-blue hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue animate-fade-in-up"
        >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 border border-border-color shadow-inner mb-4">
                 {icon}
            </div>
            <h3 className="font-bold text-lg text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{description}</p>
            <p className="text-sm font-semibold text-accent-color-blue mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {t('tools_launch_cta')}
            </p>
        </button>
    );
};

export default ToolCard;