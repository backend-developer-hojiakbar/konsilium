

import React from 'react';
import { AIModel } from './constants/specialists';

const GeminiLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.71429 13.0612L12 19.347L18.2857 13.0612L12 6.77551L5.71429 13.0612Z" fill="url(#paint0_linear_gemini)"/><path d="M12 6.77551L5.71429 13.0612L12 19.347L18.2857 13.0612L12 6.77551ZM4 13.0612L12 21L20 13.0612L12 5L4 13.0612Z" fill="url(#paint1_linear_gemini)"/><defs><linearGradient id="paint0_linear_gemini" x1="12" y1="6.77551" x2="12" y2="19.347" gradientUnits="userSpaceOnUse"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#3b82f6"/></linearGradient><linearGradient id="paint1_linear_gemini" x1="12" y1="5" x2="12" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#93c5fd"/><stop offset="1" stopColor="#60a5fa"/></linearGradient></defs></svg>
);
const ClaudeLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" transform="translate(4 4)" /></svg>
);
const GptLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.75329 21.5 2.5 17.2467 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z" stroke="currentColor" strokeWidth="1.5" /><path d="M12 17.5V14.5M12 14.5L8.5 12.5L12 10.5L15.5 12.5L12 14.5ZM12 10.5V6.5M8.5 12.5L7 11.5M15.5 12.5L17 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const LlamaLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 14L9 5L12 14M9 5L6.5 5M9 5L11.5 5M4 21L5.19559 18.4088C5.64368 17.4329 6.64393 16.8053 7.73139 16.9642L12 17.6667M18 14L15 5L12 14M15 5L17.5 5M15 5L12.5 5M20 21L18.8044 18.4088C18.3563 17.4329 17.3561 16.8053 16.2686 16.9642L12 17.6667M12 14L12 17.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const GrokLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21V15M15 18H9M12 15L4 7M12 15L20 7M8 3H16M4 7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const OrkestratorLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.6231 10.0945C19.8009 10.6358 19.888 11.2096 19.888 11.7999C19.888 16.2339 16.3219 19.8879 11.9769 19.8879C9.76648 19.8879 7.78853 18.914 6.42512 17.4043M4.26491 14.1953C4.09436 13.6331 4 13.0401 4 12.4217C4 8.03153 7.50275 4.42173 11.7954 4.42173C13.9351 4.42173 15.8569 5.34444 17.2143 6.78531" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
);

const commonStyle = { bg: 'bg-slate-100', border: 'border-slate-200' };

export const AI_SPECIALISTS = {
    [AIModel.GEMINI]: { name: 'Cardiologist AI (Gemini)', specialty: 'Cardiology', Logo: GeminiLogo, text: 'text-blue-600', ...commonStyle },
    [AIModel.CLAUDE]: { name: 'Neurologist AI (Claude)', specialty: 'Neurology', Logo: ClaudeLogo, text: 'text-orange-600', ...commonStyle },
    [AIModel.GPT]: { name: 'Radiologist AI (GPT-4o)', specialty: 'Radiology', Logo: GptLogo, text: 'text-teal-600', ...commonStyle },
    [AIModel.LLAMA]: { name: 'Oncologist AI (Llama 3)', specialty: 'Oncology', Logo: LlamaLogo, text: 'text-rose-600', ...commonStyle },
    [AIModel.GROK]: { name: 'Endocrinologist AI (Grok)', specialty: 'Endocrinology', Logo: GrokLogo, text: 'text-indigo-600', ...commonStyle },
    [AIModel.SYSTEM]: { name: 'Konsilium Chair (Orchestrator)', specialty: 'Moderator', Logo: OrkestratorLogo, text: 'text-slate-700', bg: 'bg-slate-200', border: 'border-slate-300' },
};
