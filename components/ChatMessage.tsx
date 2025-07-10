import React from 'react';
import type { ChatMessage as ChatMessageProps } from '../types';
import { AI_MODEL_CONFIG } from '../constants';
import AIAvatar from './AIAvatar';
import SpinnerIcon from './icons/SpinnerIcon';

const ChatMessage: React.FC<{ message: ChatMessageProps }> = ({ message }) => {
    const { author, content, isThinking } = message;
    const config = AI_MODEL_CONFIG[author];

    if (!config) return null;

    // Don't render empty thinking bubbles that have been replaced
    if (isThinking && !content) return null;
    
    // Animate each message
    const animationDelay = `${Math.random() * 0.3}s`;

    return (
        <div 
          className="flex items-start gap-4 my-6 animate-fade-in-up"
          style={{ animationDelay }}
        >
            <AIAvatar model={author} />
            <div className="flex-1 -mt-1">
                <p className={`font-bold text-sm ${config.text}`}>{config.name}</p>
                <div className={`
                    mt-1 p-4 rounded-xl shadow-sm
                    ${config.bg} 
                    border ${config.border}
                    text-slate-700
                    prose prose-sm max-w-none prose-p:my-2
                `}>
                    {isThinking ? (
                        <div className="flex items-center gap-3 text-slate-500">
                            <SpinnerIcon className="w-4 h-4" />
                            <span>{content}</span>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap">{content}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;