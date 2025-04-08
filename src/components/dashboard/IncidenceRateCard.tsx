'use client';

import { useState, useEffect } from 'react';
import StatusCard from './StatusCard';

interface IncidenceRateCardProps {
  totalGuides: number;
  overallPercentage: number;
  totalIncidents: number;
}

export default function IncidenceRateCard({
  totalGuides,
  overallPercentage,
  totalIncidents
}: IncidenceRateCardProps) {
  // Format the percentage to display with 2 decimal places
  const percentage = overallPercentage * 100;
  
  // Ensure totalIncidents is a valid number
  const safeIncidents = isNaN(totalIncidents) ? 0 : totalIncidents;
  
  return (
    <StatusCard 
      title="Tasa de incidencias"
      count={percentage} // Already converted to percentage for display
      bgColor="bg-blue-50"
      textColor="text-blue-800"
      borderColor="border-blue-100"
      suffix={`% (${safeIncidents} de ${totalGuides})`}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
    />
  );
}
