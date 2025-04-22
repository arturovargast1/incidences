'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CourierData {
  messaging_name: string;
  total_records: number;
  total_incidents: number;
  percentaje?: number;
  percentage_of_guides?: number;
  percentage_of_total_incidents?: number;
}

interface SingleCourierCardProps {
  courier: CourierData;
}

export default function SingleCourierCard({
  courier
}: SingleCourierCardProps) {
  // Ensure all values are valid numbers - handle both old and new API formats
  const percentage = courier.percentage_of_guides ?? courier.percentaje ?? 0;
  const safePercentage = isNaN(percentage) ? 0 : percentage;
  const safeRecords = isNaN(courier.total_records) ? 0 : courier.total_records;
  const safeIncidents = isNaN(courier.total_incidents) ? 0 : courier.total_incidents;
  
  // Function to determine color based on percentage
  const getColorClass = (percentage: number): string => {
    if (percentage < 0.2) return 'bg-green-500 text-white';
    if (percentage < 0.5) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };
  
  // Mapping of courier names to their logo paths
  const courierLogos: Record<string, string> = {
    'DHL': '/logos/dhl-logo-wine.svg',
    'FEDEX': '/logos/fedex.png',
    'ESTAFETA': '/logos/estafeta_logo.png',
    'UPS': '/logos/UPS.svg',
    '99MIN': '/logos/99min.svg',
    'AMPM': '/logos/ampm.png',
    'EXPRESS': '/logos/express.png',
    'JTEXPRESS': '/logos/JTExpress.svg',
    'T1ENVIOS': '/logos/T1envios.png'
  };

  // Function to determine text color based on percentage
  const getTextColorClass = (percentage: number): string => {
    if (percentage < 0.2) return 'text-green-600';
    if (percentage < 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="tienvios-card p-6 border border-[var(--gray-200)] shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          {courierLogos[courier.messaging_name] ? (
            <div className="w-12 h-12 flex items-center justify-center">
              <Image 
                src={courierLogos[courier.messaging_name]} 
                alt={`${courier.messaging_name} logo`} 
                width={48} 
                height={48} 
                style={{ objectFit: 'contain' }} 
              />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${getColorClass(safePercentage)}`}>
              {courier.messaging_name ? courier.messaging_name.substring(0, 1) : '?'}
            </div>
          )}
          <div className="ml-4">
            <h3 className="text-lg font-bold text-[var(--gray-800)]">
              {courier.messaging_name || 'Desconocido'}
            </h3>
            <p className="text-sm text-[var(--gray-600)]">
              Desempeño de paquetería
            </p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total de guías */}
        <div className="bg-white p-4 rounded-lg border border-[var(--gray-200)] shadow-sm">
          <h4 className="text-sm font-semibold text-[var(--gray-600)] mb-2">Total de guías</h4>
          <p className="text-2xl font-bold text-[var(--gray-900)]">{safeRecords.toLocaleString()}</p>
        </div>

        {/* Total de incidencias */}
        <div className="bg-white p-4 rounded-lg border border-[var(--gray-200)] shadow-sm">
          <h4 className="text-sm font-semibold text-[var(--gray-600)] mb-2">Total de incidencias</h4>
          <p className="text-2xl font-bold text-[var(--gray-900)]">{safeIncidents.toLocaleString()}</p>
        </div>

        {/* Tasa de incidencias */}
        <div className="bg-white p-4 rounded-lg border border-[var(--gray-200)] shadow-sm">
          <h4 className="text-sm font-semibold text-[var(--gray-600)] mb-2">Tasa de incidencias</h4>
          <p className={`text-2xl font-bold ${getTextColorClass(safePercentage)}`}>
            {safePercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[var(--gray-700)]">Tasa de incidencias</span>
          <span className={`text-sm font-bold ${getTextColorClass(safePercentage)}`}>
            {safePercentage.toFixed(2)}%
          </span>
        </div>
        <div className="w-full bg-[var(--gray-200)] rounded-full h-2.5 overflow-hidden shadow-inner">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${getColorClass(safePercentage)}`} 
            style={{ width: `${Math.min(safePercentage * 100, 100)}%` }}
          ></div>
        </div>
        <p className="mt-2 text-xs text-[var(--gray-600)]">
          {safeIncidents} incidencias de {safeRecords} guías procesadas
        </p>
      </div>
    </div>
  );
}
