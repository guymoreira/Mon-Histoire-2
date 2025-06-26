import { useState } from 'react';
import RgpdModal from '../cookies/RgpdModal';

function Footer() {
  const [showRgpdModal, setShowRgpdModal] = useState(false);
  
  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 text-center py-2 bg-white/70 z-10">
        <a 
          href="#" 
          className="text-primary opacity-80 hover:opacity-100 hover:underline text-sm mr-4"
          onClick={(e) => {
            e.preventDefault();
            setShowRgpdModal(true);
          }}
        >
          Vie privée & RGPD
        </a>
        <a 
          href="#" 
          className="text-primary opacity-80 hover:opacity-100 hover:underline text-sm"
          onClick={(e) => {
            e.preventDefault();
            setShowRgpdModal(true);
          }}
        >
          Paramètres des cookies
        </a>
      </footer>
      
      <RgpdModal 
        show={showRgpdModal} 
        onClose={() => setShowRgpdModal(false)} 
      />
    </>
  );
}

export default Footer;