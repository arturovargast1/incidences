'use client';

import { useState, useEffect } from 'react';

interface StatusCardProps {
  title: string;
  count: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  suffix?: string;
}

export default function StatusCard({ 
  title, 
  count, 
  bgColor, 
  textColor, 
  borderColor,
  icon,
  trend,
  suffix = ''
}: StatusCardProps) {
  const [animatedCount, setAnimatedCount] = useState(0);
  
  // Animación del contador
  useEffect(() => {
    const duration = 1000; // duración en ms
    const frameDuration = 1000 / 60; // duración de cada frame (60fps)
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentCount = Math.round(count * progress);
      
      setAnimatedCount(currentCount);
      
      if (frame === totalFrames) {
        clearInterval(counter);
      }
    }, frameDuration);
    
    return () => clearInterval(counter);
  }, [count]);
  
  // Icono predeterminado si no se proporciona uno
  const defaultIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  // Formatear el número si es grande
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  return (
    <div className={`${bgColor} p-6 rounded-xl border ${borderColor} shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-bold ${textColor} mb-1`}>
            {title}
          </p>
          <div className="flex items-baseline mt-2">
            <p className={`text-3xl font-extrabold ${textColor}`}>
              {formatNumber(animatedCount)}
            </p>
            {suffix && (
              <span className={`ml-1 text-sm font-medium ${textColor} opacity-80`}>
                {suffix}
              </span>
            )}
          </div>
          
          {trend && (
            <div className={`flex items-center mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <svg 
                className="w-4 h-4 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {trend.isPositive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                )}
              </svg>
              <span className="text-xs font-semibold">
                {trend.isPositive ? '+' : ''}{trend.value}% vs. periodo anterior
              </span>
            </div>
          )}
        </div>
        
        <div className={`${textColor} p-2 rounded-full bg-opacity-10 bg-current flex items-center justify-center`} style={{ width: '48px', height: '48px', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
          {icon || defaultIcon}
        </div>
      </div>
      
      {/* Barra de progreso opcional para visualizar el valor */}
      {count > 0 && count <= 100 && (
        <div className="mt-4 w-full bg-gray-200 bg-opacity-30 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-current h-1.5 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${animatedCount}%`, opacity: 0.7 }}
          ></div>
        </div>
      )}
    </div>
  );
}
