import { useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import RenameProfileModal from './RenameProfileModal';

function ChildProfileList({ profiles }) {
  const { deleteChildProfile } = useProfile();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  const handleDelete = async (id) => {
    if (confirm("Es-tu sûr de vouloir supprimer ce profil ?")) {
      try {
        await deleteChildProfile(id);
      } catch (error) {
        console.error("Error deleting profile:", error);
        window.showMessageModal("Erreur lors de la suppression du profil.");
      }
    }
  };
  
  const handleRename = (profile) => {
    setSelectedProfile(profile);
    setShowRenameModal(true);
  };

  if (profiles.length === 0) {
    return <p className="text-center text-gray-500 italic">Aucun profil enfant</p>;
  }

  return (
    <>
      <ul className="space-y-2">
        {profiles.map(profile => (
          <li 
            key={profile.id} 
            className="flex items-center justify-between bg-cream rounded-lg p-3"
            data-id={profile.id}
          >
            <span className="font-bold">{profile.prenom}</span>
            <span className="text-gray-600 mx-4">{profile.nb_histoires || 0}/10</span>
            <div className="flex items-center">
              <button 
                type="button"
                className="text-gray-600 hover:text-gray-800 mx-1 text-xl"
                onClick={() => handleRename(profile)}
                title="Renommer"
              >
                ✏️
              </button>
              <button 
                type="button"
                className="text-red-500 hover:text-red-700 mx-1"
                onClick={() => handleDelete(profile.id)}
                title="Supprimer"
              >
                <img 
                  src="/corbeille-cartoon.png" 
                  alt="Supprimer" 
                  className="w-6 h-6"
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
      
      <RenameProfileModal 
        show={showRenameModal}
        profile={selectedProfile}
        onClose={() => setShowRenameModal(false)}
      />
    </>
  );
}

export default ChildProfileList;