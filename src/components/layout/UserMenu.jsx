import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../ui/Button';
import AccountModal from '../profile/AccountModal';

function UserMenu({ onClose }) {
  const { logout } = useAuth();
  const { childProfiles, currentProfile, switchToChildProfile, switchToParentProfile } = useProfile();
  const { notifications } = useNotification();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Error logging out:", error);
      window.showMessageModal("Erreur lors de la déconnexion. Veuillez réessayer.");
    }
  };

  const handleProfileSwitch = (profileId) => {
    switchToChildProfile(profileId);
    onClose();
  };

  const handleParentSwitch = () => {
    if (currentProfile?.type === 'parent') {
      onClose();
      return;
    }
    
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would verify the password here
    // For now, we'll just switch to parent profile
    switchToParentProfile();
    setShowPasswordModal(false);
    onClose();
  };

  // Get notification count for a profile
  const getNotificationCount = (profileId) => {
    return notifications[profileId] || 0;
  };

  return (
    <>
      <div 
        ref={menuRef}
        className="absolute right-0 top-20 w-64 bg-white rounded-3xl shadow-xl p-4 z-50 border-4 border-primary-light"
      >
        <p className="text-center font-bold mb-4 text-primary-dark text-lg">
          {currentProfile?.type === 'parent' 
            ? 'Profil Parent' 
            : currentProfile?.prenom
          }
        </p>
        
        <div className="space-y-2 mb-4">
          {currentProfile?.type === 'parent' ? (
            // Show child profiles
            childProfiles.map(profile => (
              <button
                key={profile.id}
                className="ui-button ui-button--primary relative bg-gradient-to-r from-primary-light to-blue-400 hover:from-blue-400 hover:to-primary-light shadow-md"
                onClick={() => handleProfileSwitch(profile.id)}
              >
                {profile.prenom}
                {getNotificationCount(profile.id) > 0 && (
                  <span className="notification-indicator">
                    {getNotificationCount(profile.id) > 9 ? '9+' : getNotificationCount(profile.id)}
                  </span>
                )}
              </button>
            ))
          ) : (
            // Show parent profile
            <button
              className="ui-button ui-button--primary relative bg-gradient-to-r from-primary-light to-blue-400 hover:from-blue-400 hover:to-primary-light shadow-md"
              onClick={handleParentSwitch}
            >
              Parent
              {getNotificationCount('parent') > 0 && (
                <span className="notification-indicator">
                  {getNotificationCount('parent') > 9 ? '9+' : getNotificationCount('parent')}
                </span>
              )}
            </button>
          )}
          
          {/* Show other child profiles if on a child profile */}
          {currentProfile?.type === 'enfant' && 
            childProfiles
              .filter(profile => profile.id !== currentProfile.id)
              .map(profile => (
                <button
                  key={profile.id}
                  className="ui-button ui-button--primary relative bg-gradient-to-r from-primary-light to-blue-400 hover:from-blue-400 hover:to-primary-light shadow-md"
                  onClick={() => handleProfileSwitch(profile.id)}
                >
                  {profile.prenom}
                  {getNotificationCount(profile.id) > 0 && (
                    <span className="notification-indicator">
                      {getNotificationCount(profile.id) > 9 ? '9+' : getNotificationCount(profile.id)}
                    </span>
                  )}
                </button>
              ))
          }
        </div>
        
        {currentProfile?.type === 'parent' && (
          <div>
            <Button 
              variant="secondary" 
              className="mb-3 bg-gradient-to-r from-secondary-light to-purple-400 hover:from-purple-400 hover:to-secondary-light shadow-md"
              onClick={() => setShowAccountModal(true)}
            >
              Mon Compte
            </Button>
          </div>
        )}
        
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <Button 
              variant="secondary" 
              onClick={onClose}
              className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 shadow-md"
            >
              Annuler
            </Button>
          </div>
          
          {currentProfile?.type === 'parent' && (
            <div className="flex-1">
              <Button 
                variant="primary" 
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 shadow-md"
              >
                Déconnecter
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Parent password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-80 border-4 border-primary-light shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center text-primary-dark">Mot de passe parent</h3>
            <p className="mb-4 text-center">
              Pour des raisons de sécurité, veuillez saisir le mot de passe du compte parent pour changer de profil.
            </p>
            
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="ui-input border-2 border-primary-light focus:border-primary focus:ring-2 focus:ring-primary-light/50 rounded-xl"
                placeholder="Mot de passe parent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <div className="flex justify-between gap-4 mt-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 shadow-md"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  className="bg-gradient-to-r from-primary-light to-blue-400 hover:from-blue-400 hover:to-primary-light shadow-md"
                >
                  Valider
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Account modal */}
      <AccountModal 
        show={showAccountModal} 
        onClose={() => setShowAccountModal(false)} 
      />
    </>
  );
}

export default UserMenu;