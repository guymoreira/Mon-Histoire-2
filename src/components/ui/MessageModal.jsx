import { useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

function MessageModal({ show, message, onClose, autoClose = false, autoCloseDelay = 3000 }) {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, autoCloseDelay, onClose]);

  return (
    <Modal 
      show={show} 
      onClose={onClose}
      size="small"
      variant="cream"
    >
      <div className="text-center">
        <p className="mb-4" dangerouslySetInnerHTML={{ __html: message }}></p>
        <Button onClick={onClose}>OK</Button>
      </div>
    </Modal>
  );
}

export default MessageModal;