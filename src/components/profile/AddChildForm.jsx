import React, { useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

function AddChildForm({ onCancel, onSuccess }) {
  const [prenom, setPrenom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { createChildProfile } = useProfile();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prenom.trim()) {
      setError("Le prénom ne peut pas être vide.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await createChildProfile({ prenom: prenom.trim() });
      onSuccess();
    } catch (error) {
      console.error("Error creating child profile:", error);
      setError("Erreur lors de la création du profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-cream rounded-lg animate-[screen-fade-in_0.3s_forwards]">
      <h5 className="font-bold mb-2">Ajouter un profil enfant</h5>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      
      <Input
        type="text"
        id="input-prenom-enfant"
        placeholder="Prénom de l'enfant"
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
      />
      
      <div className="flex justify-between gap-4 mt-4">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          type="button" 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Ajout...' : 'Ajouter'}
        </Button>
      </div>
    </div>
  );
}

export default AddChildForm;