import React from 'react';
import { AIModel } from '../types';
import { AI_MODEL_CONFIG } from '../constants';

interface AIAvatarProps {
    model: AIModel;
    size?: 'sm' | 'md';
}

const AIAvatar: React.FC<AIAvatarProps> = ({ model, size = 'md' }) => {
    const config = AI_MODEL_CONFIG[model];
    if (!config) return null;

    const sizeClasses = {
        sm: { wrapper: 'w-8 h-8', logo: 'w-4 h-4' },
        md: { wrapper: 'w-11 h-11', logo: 'w-6 h-6' },
    };

    return (
        <div className="flex-shrink-0">
            <div 
                className={`
                    ${sizeClasses[size].wrapper}
                    ${config.bg}
                    rounded-full 
                    flex 
                    items-center 
                    justify-center 
                    ring-1
                    ring-slate-200
                    border border-transparent
                    shadow-sm
                `}
            >
                <div 
                    className={`
                        w-full h-full rounded-full flex items-center justify-center
                        bg-slate-100/50
                    `}
                >
                     <config.Logo className={`${sizeClasses[size].logo} ${config.text}`} />
                </div>
            </div>
        </div>
    );
};

export default AIAvatar;