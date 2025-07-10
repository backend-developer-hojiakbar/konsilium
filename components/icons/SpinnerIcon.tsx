import React from 'react';

const SpinnerIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg 
        className={`${className} animate-spin`} 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0f172a', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="rgba(0, 0, 0, 0.1)" 
            strokeWidth="10" 
        />
        <path 
            d="M50 5
               A45 45 0 0 1 95 50" 
            fill="none" 
            stroke="url(#spinner-gradient)" 
            strokeWidth="10"
            strokeLinecap="round" 
        />
    </svg>
);

export default SpinnerIcon;