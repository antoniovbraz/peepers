import React from 'react';

interface PeepersLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

const sizeMap = {
  sm: { width: 120, height: 45 },
  md: { width: 160, height: 60 },
  lg: { width: 200, height: 75 },
  xl: { width: 280, height: 105 }
};

export default function PeepersLogo({ 
  size = 'md', 
  variant = 'full', 
  className = '' 
}: PeepersLogoProps) {
  const { width, height } = sizeMap[size];
  
  if (variant === 'icon') {
    return (
      <svg 
        width={height} 
        height={height} 
        viewBox="0 0 200 200" 
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Crown */}
        <g fill="#F1C40F">
          <circle cx="60" cy="30" r="12"/>
          <circle cx="100" cy="20" r="15"/>
          <circle cx="140" cy="30" r="12"/>
          <path d="M45 45 L60 30 L80 40 L100 20 L120 40 L140 30 L155 45 L140 65 L45 65 Z"/>
        </g>
        
        {/* Frog Face */}
        <g fill="#2D5A27" stroke="#1A3D1A" strokeWidth="2">
          <path d="M40 80 Q40 60 70 60 Q100 60 130 65 Q170 70 170 80 Q170 120 130 150 Q100 160 70 150 Q40 120 40 80 Z"/>
          
          {/* Eyes */}
          <circle cx="75" cy="95" r="20" fill="white"/>
          <circle cx="125" cy="95" r="20" fill="white"/>
          <circle cx="75" cy="95" r="15" fill="#2D5A27"/>
          <circle cx="125" cy="95" r="15" fill="#2D5A27"/>
          <circle cx="75" cy="95" r="10" fill="black"/>
          <circle cx="125" cy="95" r="10" fill="black"/>
          <circle cx="78" cy="92" r="3" fill="white"/>
          <circle cx="128" cy="92" r="3" fill="white"/>
          
          {/* Nostrils */}
          <circle cx="90" cy="110" r="2" fill="#1A3D1A"/>
          <circle cx="110" cy="110" r="2" fill="#1A3D1A"/>
        </g>
      </svg>
    );
  }
  
  if (variant === 'text') {
    return (
      <div className={`font-bold text-primary-800 ${className}`} style={{ fontSize: height * 0.4 }}>
        Peepers
      </div>
    );
  }
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 400 150" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crown */}
      <g fill="#F1C40F">
        <circle cx="50" cy="25" r="10"/>
        <circle cx="75" cy="18" r="12"/>
        <circle cx="100" cy="25" r="10"/>
        <path d="M38 35 L50 25 L62 30 L75 18 L88 30 L100 25 L112 35 L100 50 L38 50 Z"/>
      </g>
      
      {/* Frog Face */}
      <g fill="#2D5A27" stroke="#1A3D1A" strokeWidth="1.5">
        <path d="M25 65 Q25 50 45 50 Q65 50 85 55 Q115 60 115 65 Q115 95 85 115 Q65 120 45 115 Q25 95 25 65 Z"/>
        
        {/* Eyes */}
        <circle cx="50" cy="75" r="12" fill="white"/>
        <circle cx="80" cy="75" r="12" fill="white"/>
        <circle cx="50" cy="75" r="9" fill="#2D5A27"/>
        <circle cx="80" cy="75" r="9" fill="#2D5A27"/>
        <circle cx="50" cy="75" r="6" fill="black"/>
        <circle cx="80" cy="75" r="6" fill="black"/>
        <circle cx="52" cy="73" r="2" fill="white"/>
        <circle cx="82" cy="73" r="2" fill="white"/>
        
        {/* Nostrils */}
        <circle cx="60" cy="85" r="1.5" fill="#1A3D1A"/>
        <circle cx="70" cy="85" r="1.5" fill="#1A3D1A"/>
      </g>
      
      {/* Text */}
      <text 
        x="140" 
        y="90" 
        fontFamily="Inter, sans-serif" 
        fontSize="36" 
        fontWeight="bold" 
        fill="#2D5A27"
      >
        Peepers
      </text>
    </svg>
  );
}
