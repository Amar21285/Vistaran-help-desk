import React from 'react';

const Logo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "h-10", style }) => (
    <img 
        src="/vistaran-logo.png" 
        alt="Vistaran Logo" 
        className={`object-contain ${className}`} 
        style={style} 
        crossOrigin="anonymous" 
    />
);

export default Logo;