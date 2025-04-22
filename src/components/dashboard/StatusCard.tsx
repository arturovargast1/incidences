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
  percentageOfIncidents?: number;
  percentageOfTotalGuides?: number;
}

export default function StatusCard({ 
  title, 
  count, 
  bgColor, 
  textColor, 
  borderColor,
  icon,
  trend,
  suffix = '',
  percentageOfIncidents = 0,
  percentageOfTotalGuides = 0
}: StatusCardProps) {
  const [animatedCount, setAnimatedCount] = useState(0);
  
  // Animación del contador mejorada
  useEffect(() => {
    const duration = 1200; // duración en ms - ligeramente más lenta para mejor efecto
    const frameDuration = 1000 / 60; // duración de cada frame (60fps)
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    // Función de easing para una animación más natural
    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);
    
    const counter = setInterval(() => {
      frame++;
      const progress = easeOutQuart(frame / totalFrames);
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
    <div className={`${bgColor} p-6 rounded-xl border ${borderColor} shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-bold ${textColor} uppercase tracking-wider mb-1`}>
            {title}
          </p>
          <div className="flex items-baseline mt-2">
            <p className={`text-3xl font-extrabold ${textColor} tracking-tight`}>
              {formatNumber(animatedCount)}
            </p>
            {suffix && (
              <span className={`ml-1 text-sm font-medium ${textColor} opacity-80`}>
                {suffix}
              </span>
            )}
          </div>
          
          {trend && (
            <div className={`flex items-center mt-3 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`flex items-center justify-center w-5 h-5 rounded-full ${trend.isPositive ? 'bg-green-100' : 'bg-red-100'} mr-2`}>
                <svg 
                  className="w-3 h-3" 
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
              </div>
              <span className="text-xs font-semibold">
                {trend.isPositive ? '+' : ''}{trend.value}% vs. periodo anterior
              </span>
            </div>
          )}
        </div>
        
        <div className={`${textColor} p-3 rounded-xl bg-white bg-opacity-50 flex items-center justify-center shadow-sm`} style={{ width: '52px', height: '52px' }}>
          {icon || defaultIcon}
        </div>
      </div>
      
      {/* Estadísticas de porcentajes */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-medium ${textColor} opacity-80`}>
            % del total de incidencias
          </span>
          <span className={`text-xs font-semibold ${textColor}`}>
            {percentageOfIncidents.toFixed(2)}%
          </span>
        </div>
        <div className="w-full bg-white bg-opacity-30 rounded-full h-2 overflow-hidden shadow-inner">
          <div 
            className="bg-current h-2 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${percentageOfIncidents}%`, opacity: 0.8 }}
          ></div>
        </div>
      </div>
      
      {/* Removed additional progress bar */}
    </div>
  );
}
