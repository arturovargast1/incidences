'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CourierData {
  messaging_name: string;
  total_records: number;
  total_incidents: number;
  percentaje: number;
}

interface CourierPerformanceCardProps {
  couriers: CourierData[];
  isFiltered?: boolean;
}

export default function CourierPerformanceCard({
  couriers,
  isFiltered = false
}: CourierPerformanceCardProps) {
  // Function to determine color based on percentage
  const getColorClass = (percentage: number): string => {
    if (percentage < 0.2) return 'bg-green-500';
    if (percentage < 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
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
  
  // Ensure couriers is an array
  const safeCouriers = Array.isArray(couriers) ? couriers : [];

  return (
    <div className="tienvios-card p-6 border border-[var(--gray-200)] shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--gray-700)] uppercase tracking-wider">
            Desempeño por paquetería
          </h3>
          <p className="text-xs text-[var(--gray-600)] mt-1">
            Tasa de incidencias por mensajería
          </p>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* Scrollable list of couriers */}
      <div className="mt-4 max-h-64 overflow-y-auto pr-1">
        {safeCouriers.length === 0 ? (
          <div className="text-center py-4 text-[var(--gray-500)]">
            No hay datos disponibles
          </div>
        ) : (
          <div className="space-y-4">
            {safeCouriers.map((courier, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-[var(--gray-200)] rounded-lg hover:shadow-sm transition-all duration-300">
                <div className="flex items-center">
                  {courierLogos[courier.messaging_name] ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Image 
                        src={courierLogos[courier.messaging_name]} 
                        alt={`${courier.messaging_name} logo`} 
                        width={32} 
                        height={32} 
                        style={{ objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getColorClass(courier.percentaje)}`}>
                      {courier.messaging_name ? courier.messaging_name.substring(0, 1) : '?'}
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-[var(--gray-800)]">{courier.messaging_name || 'Desconocido'}</p>
                    <p className="text-xs text-[var(--gray-600)]">{courier.total_records || 0} guías</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--gray-900)]">{courier.percentaje.toFixed(2)}%</p>
                  <p className="text-xs text-[var(--gray-600)]">{courier.total_incidents || 0} incidencias</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
