import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

/**
 * Accessible, viewport-safe modal wrapper rendered into document.body via portal
 * so ancestor transforms/backdrop-filters never trap fixed positioning.
 */
export const Modal = ({ onClose, maxWidth = 'md', isClosing = false, children, className = '' }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const widthClass = MAX_WIDTH_CLASSES[maxWidth] || MAX_WIDTH_CLASSES.md;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${widthClass} max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] my-auto bg-[#0f1623] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
          isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        } ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
