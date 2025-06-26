import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useNotification } from '../../contexts/NotificationContext';
import UserMenu from './UserMenu';

function Header() {
  const { currentUser } = useAuth();
  const { currentProfile } = useProfile();
  const { notifications } = useNotification();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Get notification count for current profile
  const getNotificationCount = () => {
    if (!currentProfile) return 0;
    
    const profileId = currentProfile.type === 'parent' ? 'parent' : currentProfile.id;
    return notifications[profileId] || 0;
  };
  
  const notificationCount = getNotificationCount();

  return (
    <header className="absolute top-0 right-0 p-4 z-10">
      {currentUser ? (
        <div className="relative">
          <button 
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary-dark text-2xl font-bold shadow-lg border-4 border-primary-light hover:scale-105 active:scale-95 transition-transform"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {currentProfile?.type === 'parent' 
              ? (currentUser.email?.charAt(0).toUpperCase() || 'U')
              : currentProfile?.prenom?.charAt(0).toUpperCase() || 'U'
            }
            
            {notificationCount > 0 && (
              <span className="notification-indicator">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          
          {showUserMenu && (
            <UserMenu onClose={() => setShowUserMenu(false)} />
          )}
        </div>
      ) : (
        <div>
          <Link 
            to="/login" 
            className="ui-button ui-button--primary w-auto px-6 py-2 bg-gradient-to-r from-primary-light to-blue-400 hover:from-blue-400 hover:to-primary-light shadow-md rounded-full"
          >
            Me connecter
          </Link>
        </div>
      )}
    </header>
  );
}

export default Header;