import { useState, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

function RenameProfileModal({ show, profile, onClose }) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { updateChildProfile } = useProfile();
  
  useEffect(() => {
    if (show && profile) {
      setNewName(profile.prenom || '');
      setError('');
    }
  }, [show, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setError("Le prénom ne peut pas être vide.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await updateChildProfile(profile.id, { prenom: newName.trim() });
      onClose();
    } catch (error) {
      console.error("Error renaming profile:", error);
      setError("Erreur lors du renommage du profil.");
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
      <h3 className="text-xl font-bold mb-4">Renommer le profil</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          id="input-nouveau-prenom"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={30}
        />
        
        <div className="flex justify-center gap-8 mt-6">
          <img 
            src="/croix-cartoon.png" 
            alt="Annuler" 
            title="Annuler" 
            className="h-12 cursor-pointer" 
            onClick={onClose}
          />
          <img 
            src="/coche-verte-cartoon.png" 
            alt="Valider" 
            title="Valider" 
            className="h-12 cursor-pointer" 
            onClick={handleSubmit}
          />
        </div>
      </form>
    </Modal>
  );
}

export default RenameProfileModal;