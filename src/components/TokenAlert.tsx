'use client';

import { useState, useEffect } from 'react';
import TokenModal from './TokenModal';
import { resetTokenIssue } from '../lib/tokenUtils';

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

    // Clean up interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Clear the token issue flag when the component unmounts (page navigation/refresh)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.tokenHasIssues = false;
      }
    };
  }, []);

  const handleCloseModal = () => {
    // Reset the token issue flag when the modal is closed
    if (typeof window !== 'undefined') {
      window.tokenHasIssues = false;
      resetTokenIssue();
    }
    setShowModal(false);
  };

  return (
    <TokenModal 
      isOpen={showModal} 
      onClose={handleCloseModal} 
    />
  );
}
