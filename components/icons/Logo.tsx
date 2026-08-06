import React from 'react';

const Logo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "text-4xl", style }) => (
    <div className={`flex items-center justify-center leading-none ${className}`} style={{ ...style, width: 'max-content' }}>
        <svg viewBox="0 0 100 100" className="h-[1em] w-auto flex-shrink-0 z-10" xmlns="http://www.w3.org/2000/svg">
            <path d="M45,45 C35,25 25,35 25,55 C25,85 45,95 65,95 C55,85 45,75 45,45" fill="#2c3e50" />
            <path d="M58,25 C48,15 38,25 38,45 C38,75 58,85 78,85 C68,75 58,65 58,25" fill="#2c3e50" />
            <path d="M15,95 C40,110 80,105 100,95 C60,115 30,105 15,95" fill="#4fa3b4" />
        </svg>
        <div className="flex items-baseline -ml-[0.1em] z-20" style={{ fontFamily: "Georgia, serif", color: "#2c3e50", fontWeight: "bold", fontSize: '0.85em' }}>
            <span>v</span>
            <span style={{ fontSize: '0.85em' }}>istaran</span>
        </div>
    </div>
);

export default Logo;