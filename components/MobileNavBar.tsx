
import React from 'react';
import PlusCircleIcon from './icons/PlusCircleIcon';
import DocumentReportIcon from './icons/DocumentReportIcon';
import LightBulbIcon from './icons/LightBulbIcon';

type AppView = 'new_analysis' | 'history' | 'research';

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
        className={`flex flex-col items-center justify-center gap-1 w-24 h-16 transition-colors duration-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeView, onNavigate }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-t-lg z-30">
            <div className="flex justify-around items-center h-16 px-2">
                <NavButton
                    isActive={['new_analysis', 'clarification', 'live_analysis'].some(v => activeView.startsWith(v))}
                    onClick={() => onNavigate('new_analysis')}
                    icon={<PlusCircleIcon className="w-6 h-6" />}
                    label="Tahlil"
                />
                <NavButton
                    isActive={['history', 'view_history_item'].some(v => activeView.startsWith(v))}
                    onClick={() => onNavigate('history')}
                    icon={<DocumentReportIcon className="w-6 h-6" />}
                    label="Tarix"
                />
                <NavButton
                    isActive={activeView.startsWith('research')}
                    onClick={() => onNavigate('research')}
                    icon={<LightBulbIcon className="w-6 h-6" />}
                    label="Tadqiqot"
                />
            </div>
        </nav>
    );
};

export default MobileNavBar;