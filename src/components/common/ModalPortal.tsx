import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

/**
 * ModalPortal: Renderiza o conteúdo do modal diretamente no <body>
 * utilizando React Portal. Isso garante que o modal seja posicionado
 * e centralizado estritamente em relação à TELA (viewport do navegador/dispositivo)
 * e não em relação à página ou a contêineres pais com transform/overflow.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children, isOpen = true }) => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Evita deslocamento do layout caso haja barra de rolagem no desktop
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};
