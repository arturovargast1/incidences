'use client';

import { useState, useRef } from 'react';
import { updateMultipleIncidents, INCIDENT_STATUS_NAMES } from '../../lib/api';
import { IncidentStatus } from '../../types/incidents';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Spanish to English status mapping
const STATUS_SPANISH_TO_ENGLISH: Record<string, IncidentStatus> = {
  'requiere acción': 'requires_action',
  'pendiente': 'pending',
  'en proceso': 'in_process',
  'finalizado': 'finalized'
};

// English to Spanish status mapping (for the example file)
const STATUS_ENGLISH_TO_SPANISH: Record<string, string> = Object.entries(STATUS_SPANISH_TO_ENGLISH)
  .reduce((acc, [spanish, english]) => {
    acc[english] = spanish;
    return acc;
  }, {} as Record<string, string>);

export default function CsvUploadModal({ isOpen, onClose, onSuccess, onError }: CsvUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      onError('Por favor selecciona un archivo CSV');
      return;
    }

    const file = fileInputRef.current.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      onError('El archivo debe ser de tipo CSV');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) {
          throw new Error('Error al leer el archivo');
        }

        const csvContent = event.target.result as string;
        const updates = parseCSV(csvContent);
        
        if (updates.length === 0) {
          throw new Error('El archivo CSV no contiene datos válidos');
        }

        // Call the API to update multiple incidents
        const result = await updateMultipleIncidents(updates);
        
        if (result.success) {
          setFileName('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onSuccess();
          onClose();
        } else {
          throw new Error(result.message || 'Error al actualizar las incidencias');
        }
      };

      reader.onerror = () => {
        throw new Error('Error al leer el archivo');
      };

      reader.readAsText(file);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsUploading(false);
    }
  };

  // Parse CSV content into an array of update objects
  const parseCSV = (csvContent: string) => {
    const lines = csvContent.split('\n');
    const updates: any[] = [];

    // Check for Spanish or English headers
    const hasHeader = lines[0].toLowerCase().includes('incident_id') || 
                      lines[0].toLowerCase().includes('id_incidencia') ||
                      lines[0].toLowerCase().includes('guía') ||
                      lines[0].toLowerCase().includes('estado');
    
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length < 2) continue;

      // Assuming first column is incident_id and second is status
      const incidentId = columns[0].trim();
      let status = columns[1].trim().toLowerCase();

      if (!incidentId || !status) continue;

      // Convert Spanish status to English if needed
      if (STATUS_SPANISH_TO_ENGLISH[status]) {
        status = STATUS_SPANISH_TO_ENGLISH[status];
      }

      // Create update object with the same structure as the example in the task
      updates.push({
        incident_id: incidentId,
        status: status,
        actionType: "address_change",
        address_change: {
          city: "Queretaro"
        },
        notes: "Actualización por carga masiva CSV"
      });
    }

    return updates;
  };

  // Generate example CSV content in Spanish
  const generateExampleCsv = () => {
    const headers = "ID_Incidencia,Estado\n";
    const rows = [
      `INC-12345,${STATUS_ENGLISH_TO_SPANISH['requires_action']}`,
      `INC-67890,${STATUS_ENGLISH_TO_SPANISH['pending']}`,
      `INC-24680,${STATUS_ENGLISH_TO_SPANISH['in_process']}`,
      `INC-13579,${STATUS_ENGLISH_TO_SPANISH['finalized']}`
    ].join('\n');
    
    return headers + rows;
  };

  // Download example CSV file
  const downloadExampleCsv = () => {
    const csvContent = generateExampleCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ejemplo_actualizacion_incidencias.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--gray-900)]">Actualización masiva de incidencias</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-sm text-[var(--gray-600)] mb-2">
          Sube un archivo CSV para actualizar el estado de múltiples incidencias a la vez.
          El archivo debe tener dos columnas: ID de incidencia y estado.
        </p>
        <div className="mb-4">
          <button 
            onClick={downloadExampleCsv}
            className="text-sm text-[var(--primary)] hover:underline flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Descargar archivo de ejemplo
          </button>
        </div>
        
        <div className="mb-4">
          <label htmlFor="csvFile" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
            Archivo CSV
          </label>
          <div className="relative">
            <input
              type="file"
              id="csvFile"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="filter-control w-full flex items-center border-dashed">
              <div className="flex-grow flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate text-sm">
                  {fileName || 'Seleccionar archivo CSV...'}
                </span>
              </div>
              <button className="tienvios-button-outline text-sm ml-2 px-4 py-2 rounded-xl flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                </svg>
                Examinar
              </button>
            </div>
          </div>
          <p className="text-xs text-[var(--gray-500)] mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Formato: ID_Incidencia,Estado
          </p>
          <div className="mt-2 text-xs text-[var(--gray-500)]">
            <p className="font-semibold mb-1">Estados válidos:</p>
            <ul className="grid grid-cols-2 gap-x-4">
              {Object.entries(STATUS_ENGLISH_TO_SPANISH).map(([english, spanish]) => (
                <li key={english} className="flex items-center">
                  <span className="w-2 h-2 bg-[var(--primary)] rounded-full mr-1"></span>
                  {spanish}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="tienvios-button-secondary px-4 py-2 rounded-xl"
            disabled={isUploading}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !fileName}
            className="tienvios-button px-4 py-2 rounded-xl flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Actualizar incidencias
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
