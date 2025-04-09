'use client';

import { useState, useEffect } from 'react';
import TokenModal from './TokenModal';

export default function TokenAlert() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Comprobamos si la variable global indica un problema con el token
    const checkTokenStatus = () => {
      if (typeof window !== 'undefined' && window.tokenHasIssues === true) {
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    };

    // Comprobar al montar el componente
    checkTokenStatus();

    // Comprobar periódicamente
    const interval = setInterval(checkTokenStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <TokenModal 
      isOpen={showModal} 
      onClose={handleCloseModal} 
    />
  );
}
