import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

function DeleteAccountModal({ show, onClose }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { deleteAccount } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }
    
    if (confirmation !== 'SUPPRIMER') {
      setError("Veuillez saisir SUPPRIMER pour confirmer.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await deleteAccount(password);
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Erreur lors de la suppression du compte. Vérifiez votre mot de passe.");
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
      <p className="text-center text-red-600 font-bold mb-4">
        Action irréversible.<br />
        Toutes vos données seront supprimées.<br />
        Êtes-vous sûr ?
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          type="password"
          id="delete-account-password"
          placeholder="Votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPasswordToggle
        />
        
        <Input
          type="text"
          id="delete-account-confirmation"
          placeholder="Tapez SUPPRIMER pour confirmer"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="mt-2"
        />
        
        <div className="flex justify-between gap-4 mt-6">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Oui, supprimer mon compte'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default DeleteAccountModal;