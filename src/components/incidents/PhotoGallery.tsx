'use client';

import { useState } from 'react';

interface Photo {
  url: string;
  title?: string;
}

interface PhotoGalleryProps {
  photos: Photo[] | string[];
  title?: string;
}

export default function PhotoGallery({ photos, title = 'Fotos' }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Normalizar el array de fotos para asegurar que todos los elementos son objetos Photo
  const normalizedPhotos: Photo[] = photos.map(photo => 
    typeof photo === 'string' ? { url: photo } : photo
  );

  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    // Esperar a que termine la animación de cierre antes de limpiar la foto seleccionada
    setTimeout(() => setSelectedPhoto(null), 300);
  };

  // Abrir la imagen en una nueva pestaña
  const openInNewTab = () => {
    if (!selectedPhoto) return;
    window.open(selectedPhoto.url, '_blank');
  };
  
  // Descargar la imagen
  const downloadPhoto = async () => {
    if (!selectedPhoto) return;
    
    try {
      // Obtener la imagen como blob usando fetch
      const response = await fetch(selectedPhoto.url);
      const blob = await response.blob();
      
      // Crear un URL para el blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear un enlace temporal para descargar la imagen
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = selectedPhoto.title || `foto-${Date.now()}.jpg`;
      
      // Simular un clic en el enlace para iniciar la descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      
      // Si falla el método anterior, intentar abrir la imagen en una nueva pestaña
      // Esto permitirá al usuario guardar la imagen manualmente
      window.open(selectedPhoto.url, '_blank');
    }
  };

  // Si no hay fotos, no mostrar nada
  if (normalizedPhotos.length === 0) return null;

  return (
    <div className="mt-3">
      <h5 className="text-sm font-semibold text-gray-700 mb-2">{title}</h5>
      <div className="flex flex-wrap gap-2">
        {normalizedPhotos.map((photo, index) => (
          <div 
            key={index} 
            className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openModal(photo)}
          >
            <img 
              src={photo.url} 
              alt={photo.title || `Foto ${index + 1}`} 
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Modal para visualizar la foto */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Cabecera del modal */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPhoto?.title || 'Visualización de foto'}
              </h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={openInNewTab}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Abrir en nueva pestaña"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button 
                  onClick={downloadPhoto}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Descargar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button 
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
              <img 
                src={selectedPhoto?.url} 
                alt={selectedPhoto?.title || 'Foto ampliada'} 
                className="max-w-full max-h-[calc(90vh-120px)] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
