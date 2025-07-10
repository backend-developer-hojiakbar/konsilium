import React from 'react';

const PillIcon: React.FC<{ className?: string }> = ({ className = "h-7 w-7 text-rose-500" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V5c0-1.105-1.79-2-4-2S4 3.895 4 5v1c0 1.105 1.79 2 4 2s4-.895 4-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c0 1.105-1.79 2-4 2s-4-.895-4-2 1.79-2 4-2 4 .895 4 2zM12 12v1c0 1.105 1.79 2 4 2s4-.895 4-2v-1c0-1.105-1.79-2-4-2s-4 .895-4 2z" />
    </svg>
);

export default PillIcon;
