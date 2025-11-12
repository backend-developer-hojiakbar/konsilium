import React, { useState, useEffect } from 'react';
import type { AIModel } from '../types';
import { AI_SPECIALISTS } from '../constants';
import AIAvatar from './AIAvatar';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface TeamRecommendationViewProps {
    recommendations: { model: AIModel; reason: string }[] | null;
    isProcessing: boolean;
    onConfirm: (confirmedTeam: AIModel[]) => void;
}

const TeamRecommendationView: React.FC<TeamRecommendationViewProps> = ({ recommendations, isProcessing, onConfirm }) => {
    const [selectedTeam, setSelectedTeam] = useState<AIModel[]>([]);

    useEffect(() => {
        if (recommendations) {
            setSelectedTeam(recommendations.map(r => r.model));
        }
    }, [recommendations]);

    const toggleSpecialist = (model: AIModel) => {
        setSelectedTeam(prev =>
            prev.includes(model)
                ? prev.filter(m => m !== model)
                : [...prev, model]
        );
    };
    
    const handleConfirm = () => {
        onConfirm(selectedTeam);
    };

    if (isProcessing || !recommendations) {
        return (
            <div className="glass-panel animate-fade-in-up p-8 text-center">
                <SpinnerIcon className="w-10 h-10 mx-auto text-accent-color-cyan" />
                <p className="mt-4 font-semibold text-text-primary">Eng kuchli mutaxassislar jamoasi shakllantirilmoqda...</p>
                <p className="text-sm text-text-secondary">Bemor ma'lumotlari tahlil qilinmoqda.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 md:p-8 animate-fade-in-up">
            <div className="text-center mb-8">
                 <h3 className="text-2xl font-bold text-text-primary">Tavsiya Etilgan Jamoa: "Eng Kuchlilar Konsiliumi"</h3>
                 <p className="text-sm text-text-secondary mt-1 max-w-2xl mx-auto">Tizim bemor ma'lumotlariga asoslanib, eng muhim mutaxassislarni tanladi. Jamoani tasdiqlang yoki o'zgartiring.</p>
            </div>

            <div className="space-y-4">
                {recommendations.map(({ model, reason }) => {
                    const specialist = AI_SPECIALISTS[model];
                    const isSelected = selectedTeam.includes(model);
                    return (
                        <div
                            key={model}
                            onClick={() => toggleSpecialist(model)}
                            className={`p-4 rounded-xl border-2 flex items-center gap-4 cursor-pointer transition-all duration-200 ${isSelected ? 'border-accent-color-blue bg-blue-500/10 shadow-md' : 'border-border-color bg-slate-50 hover:border-slate-300'}`}
                        >
                            <div className="flex-shrink-0">
                                {isSelected 
                                    ? <CheckCircleIcon className="w-6 h-6 text-accent-color-blue" />
                                    : <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white"></div>
                                }
                            </div>
                            <AIAvatar model={model} size="md" />
                            <div className="flex-1">
                                <p className="font-bold text-text-primary">{specialist.name}</p>
                                <p className="text-sm text-text-secondary">{reason}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-6 mt-6 border-t border-border-color">
                <button
                    onClick={handleConfirm}
                    disabled={selectedTeam.length === 0}
                    className="w-full flex justify-center items-center gap-3 py-3 px-4 shadow-lg text-base font-bold animated-gradient-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-color focus:ring-accent-color-blue disabled:opacity-70 transition-all duration-300 transform hover:scale-105"
                >
                    {`${selectedTeam.length} ta mutaxassis bilan Konsiliumni Boshlash`}
                </button>
            </div>
        </div>
    );
};

export default TeamRecommendationView;