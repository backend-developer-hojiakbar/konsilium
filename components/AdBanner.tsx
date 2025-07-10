import React from 'react';

interface AdBannerProps {
    title: string;
    description: string;
    slim?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({ title, description, slim = false }) => {
    return (
        <div className={`
            w-full border-2 border-dashed border-slate-300 rounded-xl
            text-center animate-fade-in-up
            ${slim ? 'p-3' : 'p-6'}
        `}>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Reklama</p>
            <h4 className={`font-semibold text-slate-700 ${slim ? 'text-sm mt-1' : 'text-base mt-2'}`}>
                {title}
            </h4>
            <p className={`text-slate-500 ${slim ? 'text-xs mt-1' : 'text-sm mt-1'}`}>
                {description}
            </p>
            <a href="#" className={`inline-block text-white text-xs font-bold rounded-full px-4 py-1.5 transition-colors
             animated-gradient-button
             ${slim ? 'mt-2' : 'mt-4'}
            `}>
                Batafsil
            </a>
        </div>
    );
};

export default AdBanner;
