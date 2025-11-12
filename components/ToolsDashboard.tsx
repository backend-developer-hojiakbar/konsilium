import React, { useState } from 'react';
import ToolCard from './tools/ToolCard';
import DrugInteractionChecker from './tools/DrugInteractionChecker';
import EcgAnalyzer from './tools/EcgAnalyzer';
import PatientExplanationGenerator from './tools/PatientExplanationGenerator';
import MedicalCodingAssistant from './tools/MedicalCodingAssistant';
import GuidelineNavigator from './tools/GuidelineNavigator';
import LabValueInterpreter from './tools/LabValueInterpreter';
import AbbreviationExpander from './tools/AbbreviationExpander';
import DischargeSummaryTool from './tools/DischargeSummaryTool';
import InsurancePreAuthTool from './tools/InsurancePreAuthTool';
import PediatricDoseCalculator from './tools/PediatricDoseCalculator';
import RiskScoringTool from './tools/RiskScoringTool';

import StethoscopeIcon from './icons/StethoscopeIcon';
import HeartPulseIcon from './icons/HeartPulseIcon';
import UserHeartIcon from './icons/UserHeartIcon';
import FileCodeIcon from './icons/FileCodeIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import FlaskIcon from './icons/FlaskIcon';
import TranslateIcon from './icons/TranslateIcon';
import DocumentReportIcon from './icons/DocumentReportIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import ChildIcon from './icons/ChildIcon';
import ChartBarIcon from './icons/ChartBarIcon';

import { useTranslation } from '../hooks/useTranslation';

type Tool = 'drug-interactions' | 'ecg-analyzer' | 'patient-explainer' | 'coding-assistant' | 'guideline-navigator' | 'lab-interpreter' | 'abbreviation-expander' | 'discharge-summary' | 'insurance-preauth' | 'pediatric-dose' | 'risk-scoring';

const toolsConfig: { id: Tool; icon: React.FC<{className?: string}>; color: string; component: React.FC<{onBack?: () => void}> }[] = [
    { id: 'guideline-navigator', icon: BookmarkIcon, color: 'text-blue-500', component: GuidelineNavigator },
    { id: 'drug-interactions', icon: StethoscopeIcon, color: 'text-rose-500', component: DrugInteractionChecker },
    { id: 'ecg-analyzer', icon: HeartPulseIcon, color: 'text-red-600', component: EcgAnalyzer },
    { id: 'risk-scoring', icon: ChartBarIcon, color: 'text-orange-500', component: RiskScoringTool },
    { id: 'discharge-summary', icon: DocumentReportIcon, color: 'text-green-600', component: DischargeSummaryTool },
    { id: 'insurance-preauth', icon: ShieldCheckIcon, color: 'text-teal-500', component: InsurancePreAuthTool },
    { id: 'pediatric-dose', icon: ChildIcon, color: 'text-pink-500', component: PediatricDoseCalculator },
    { id: 'lab-interpreter', icon: FlaskIcon, color: 'text-cyan-500', component: LabValueInterpreter },
    { id: 'patient-explainer', icon: UserHeartIcon, color: 'text-teal-500', component: PatientExplanationGenerator },
    { id: 'coding-assistant', icon: FileCodeIcon, color: 'text-indigo-500', component: MedicalCodingAssistant },
    { id: 'abbreviation-expander', icon: TranslateIcon, color: 'text-purple-500', component: AbbreviationExpander },
];

const ToolsDashboard: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool | null>(null);
    const { t } = useTranslation();

    const ActiveToolComponent = toolsConfig.find(t => t.id === activeTool)?.component;

    return (
        <div className="animate-fade-in-up">
            {ActiveToolComponent ? (
                <div>
                    <button onClick={() => setActiveTool(null)} className="text-sm font-semibold text-accent-color-blue hover:underline mb-6">
                        {t('tools_back_to_all')}
                    </button>
                    <ActiveToolComponent />
                </div>
            ) : (
                <div>
                    <div className="text-left mb-8">
                        <h2 className="text-2xl font-bold text-text-primary">{t('tools_dashboard_title')}</h2>
                        <p className="text-text-secondary">{t('tools_dashboard_subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {toolsConfig.map((tool, index) => (
                            <ToolCard
                                key={tool.id}
                                title={t(`tools_${tool.id.replace(/-/g, '_')}_title` as any)}
                                description={t(`tools_${tool.id.replace(/-/g, '_')}_desc` as any)}
                                icon={<tool.icon className={`w-8 h-8 ${tool.color}`} />}
                                onClick={() => setActiveTool(tool.id)}
                                style={{ animationDelay: `${index * 50}ms` }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsDashboard;