import { useEffect, useRef } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

function Notification() {
  const { notificationVisible, currentNotification, closeNotification } = useNotification();
  const notificationRef = useRef(null);
  const timeoutRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (notificationVisible) {
      // Auto-close after 5 seconds
      timeoutRef.current = setTimeout(() => {
        closeNotification();
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notificationVisible, closeNotification]);

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    
    // Clear auto-close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleTouchMove = (e) => {
    if (!notificationRef.current) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const diffX = Math.abs(touchX - touchStartRef.current.x);
    const diffY = Math.abs(touchY - touchStartRef.current.y);
    
    // If swiped far enough, close the notification
    if (diffX > 50 || diffY > 50) {
      closeNotification();
    }
  };

  if (!notificationVisible || !currentNotification) {
    return null;
  }

  return (
    <div 
      ref={notificationRef}
      className="ui-notification animate-[screen-fade-in_0.3s_forwards]"
      onClick={() => closeNotification()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {currentNotification.senderName} t'a partagé une histoire
    </div>
  );
}

export default Notification;