import { useState, useEffect, useRef } from 'react';
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
        className="absolute right-0 top-20 w-64 bg-cream rounded-xl shadow-lg p-4 z-50"
      >
        <p className="text-center font-bold mb-4">
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
                className="ui-button ui-button--primary relative"
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
              className="ui-button ui-button--primary relative"
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
                  className="ui-button ui-button--primary relative"
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
          <Button 
            variant="secondary" 
            className="mb-3"
            onClick={() => setShowAccountModal(true)}
          >
            Mon Compte
          </Button>
        )}
        
        <div className="flex justify-between gap-4">
          <Button 
            variant="secondary" 
            onClick={onClose}
          >
            Annuler
          </Button>
          
          {currentProfile?.type === 'parent' && (
            <Button 
              variant="primary" 
              onClick={handleLogout}
            >
              Déconnecter
            </Button>
          )}
        </div>
      </div>
      
      {/* Parent password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cream rounded-xl p-6 w-80">
            <h3 className="text-xl font-bold mb-4 text-center">Mot de passe parent</h3>
            <p className="mb-4 text-center">
              Pour des raisons de sécurité, veuillez saisir le mot de passe du compte parent pour changer de profil.
            </p>
            
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="ui-input"
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
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary">
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