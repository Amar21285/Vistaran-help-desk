import React from 'react';

const Logo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "h-10", style }) => (
    <svg 
        viewBox="0 0 350 120" 
        className={className} 
        style={style}
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMinYMid meet"
    >
        <g id="VistaranLogo">
            {/* The Stylized 'V' strokes */}
            <path d="M45,45 C35,25 25,35 25,55 C25,85 45,95 65,95 C55,85 45,75 45,45" fill="#2c3e50" />
            <path d="M58,25 C48,15 38,25 38,45 C38,75 58,85 78,85 C68,75 58,65 58,25" fill="#2c3e50" />
            
            {/* The 'v' part that blends with strokes */}
            <text x="75" y="85" style={{fontSize: "72px", fill: "#2c3e50", fontFamily: "Georgia, serif", fontWeight: "bold"}}>v</text>
            
            {/* Remaining text 'istaran' */}
            <text x="110" y="85" style={{fontSize: "64px", fill: "#2c3e50", fontFamily: "Georgia, serif", fontWeight: "bold"}}>istaran</text>
            
            {/* The Teal Swoosh */}
            <path d="M15,95 C100,135 250,75 340,45 C280,65 150,115 15,95" fill="#4fa3b4" />
            
            {/* The signature dot */}
            <circle cx="325" cy="110" r="3" fill="#2c3e50" />
        </g>
    </svg>
);

export default Logo;