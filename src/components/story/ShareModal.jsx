import { useState, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

function ShareModal({ show, onClose, story }) {
  const { childProfiles, currentProfile } = useProfile();
  const { shareStory } = useNotification();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (show) {
      // Prepare profiles list based on current profile
      if (currentProfile?.type === 'parent') {
        // If parent, show all child profiles
        setProfiles(childProfiles);
      } else {
        // If child, show parent and other child profiles
        const otherProfiles = childProfiles.filter(p => p.id !== currentProfile?.id);
        setProfiles([
          { id: 'parent', prenom: 'Parent' },
          ...otherProfiles
        ]);
      }
    }
  }, [show, childProfiles, currentProfile]);

  const handleShare = async (profileId, profileName) => {
    if (!story) return;
    
    try {
      setLoading(true);
      const success = await shareStory(story, profileId, profileName);
      
      if (success) {
        onClose();
        window.showMessageModal(`Histoire partagée avec ${profileName} !`);
      } else {
        window.showMessageModal("Erreur lors du partage de l'histoire.");
      }
    } catch (error) {
      console.error("Error sharing story:", error);
      window.showMessageModal("Erreur lors du partage de l'histoire.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onClose={onClose}
      size="small"
      variant="cream"
    >
      <h3 className="text-xl font-bold mb-4">Partager avec</h3>
      
      <div className="space-y-2 mb-4">
        {profiles.length === 0 ? (
          <p className="text-center text-gray-500 italic">Aucun profil disponible pour le partage.</p>
        ) : (
          profiles.map(profile => (
            <Button
              key={profile.id}
              onClick={() => handleShare(profile.id, profile.prenom)}
              disabled={loading}
            >
              {profile.prenom}
            </Button>
          ))
        )}
      </div>
      
      <Button 
        variant="secondary" 
        onClick={onClose}
        disabled={loading}
      >
        Annuler
      </Button>
    </Modal>
  );
}

export default ShareModal;