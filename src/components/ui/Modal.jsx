import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

function Modal({ 
  children, 
  show, 
  onClose, 
  size = 'medium',
  variant = 'cream',
  className,
  closeOnOutsideClick = true,
  ...props 
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalClasses = classNames(
    'ui-modal',
    { 'show': show }
  );

  const contentClasses = classNames(
    'ui-modal-content',
    {
      'max-w-sm': size === 'small',
      'max-w-md': size === 'medium',
      'max-w-lg': size === 'large',
      'bg-cream': variant === 'cream',
      'bg-white': variant === 'white'
    },
    className
  );

  if (!show) return null;

  return createPortal(
    <div className={modalClasses} onClick={handleOutsideClick}>
      <div 
        className={contentClasses} 
        {...props}
      >
        {children}
        <button 
          className="absolute top-3 right-3 text-2xl font-bold text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

export default Modal;