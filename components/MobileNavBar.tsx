import React from 'react';
import PlusCircleIcon from './icons/PlusCircleIcon';
import DocumentReportIcon from './icons/DocumentReportIcon';
import LightBulbIcon from './icons/LightBulbIcon';
import ToolboxIcon from './icons/ToolboxIcon';
import HomeIcon from './icons/HomeIcon';
import { useTranslation } from '../hooks/useTranslation';

type AppView = 'dashboard' | 'new_analysis' | 'history' | 'research' | 'tools';

interface MobileNavBarProps {
    activeView: string;
    onNavigate: (view: AppView) => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center gap-1 w-full h-16 transition-colors duration-200 focus:outline-none ${isActive ? 'text-accent-color-blue' : 'text-text-secondary hover:text-text-primary'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeView, onNavigate }) => {
    const { t } = useTranslation();
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-panel-bg/80 backdrop-blur-lg border-t border-border-color z-30">
            <div className="flex justify-around items-center h-16 px-1">
                <NavButton
                    isActive={activeView === 'dashboard'}
                    onClick={() => onNavigate('dashboard')}
                    icon={<HomeIcon className="w-6 h-6" />}
                    label={t('nav_dashboard')}
                />
                <NavButton
                    isActive={['new_analysis', 'live_analysis', 'clarification'].some(v => activeView.startsWith(v))}
                    onClick={() => onNavigate('new_analysis')}
                    icon={<PlusCircleIcon className="w-6 h-6" />}
                    label={t('nav_new_case')}
                />
                <NavButton
                    isActive={['history', 'view_history_item', 'live_consultation', 'prescription'].some(v => activeView.startsWith(v))}
                    onClick={() => onNavigate('history')}
                    icon={<DocumentReportIcon className="w-6 h-6" />}
                    label={t('nav_archive')}
                />
                 <NavButton
                    isActive={activeView.startsWith('tools')}
                    onClick={() => onNavigate('tools')}
                    icon={<ToolboxIcon className="w-6 h-6" />}
                    label={t('nav_tools')}
                />
                <NavButton
                    isActive={activeView.startsWith('research')}
                    onClick={() => onNavigate('research')}
                    icon={<LightBulbIcon className="w-6 h-6" />}
                    label={t('nav_research')}
                />
            </div>
        </nav>
    );
};

export default MobileNavBar;