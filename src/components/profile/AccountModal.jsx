import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ChildProfileList from './ChildProfileList';
import AddChildForm from './AddChildForm';
import DeleteAccountModal from './DeleteAccountModal';

function AccountModal({ show, onClose }) {
  const { currentUser, userInfo, loadUserInfo } = useAuth();
  const { childProfiles, loadProfiles } = useProfile();
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (show && currentUser) {
      loadUserInfo().then(info => {
        if (info) {
          setPrenom(info.prenom || '');
          setEmail(currentUser.email || '');
        }
      });
      
      loadProfiles();
    }
  }, [show, currentUser, loadUserInfo, loadProfiles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // This would update the user's account info
    // For now, we'll just close the modal
    onClose();
  };

  return (
    <>
      <Modal 
        show={show} 
        onClose={onClose}
        size="medium"
        variant="white"
      >
        <h3 className="text-xl font-bold mb-4">Mon Compte</h3>
        
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            id="compte-prenom"
            label="Prénom :"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            required
          />
          
          <Input
            type="email"
            id="compte-email"
            label="Adresse e-mail :"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
          
          <div id="compte-stock-histoires" className="text-center my-4">
            Stock d'histoires : <b>0</b> / 10
          </div>
          
          {/* Child profiles section */}
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h4 className="font-bold mb-4">Profils enfants</h4>
            
            <ChildProfileList profiles={childProfiles} />
            
            {childProfiles.length < 2 && (
              <Button 
                variant="primary" 
                onClick={() => setShowAddChildForm(true)}
                className="mt-4"
              >
                Ajouter un profil
              </Button>
            )}
            
            {showAddChildForm && (
              <AddChildForm 
                onCancel={() => setShowAddChildForm(false)} 
                onSuccess={() => {
                  setShowAddChildForm(false);
                  loadProfiles();
                }}
              />
            )}
          </div>
          
          <p className="mt-8 mb-4 text-center">
            <button 
              type="button" 
              className="text-red-600 font-bold"
              onClick={() => setShowDeleteModal(true)}
            >
              Supprimer mon compte
            </button>
          </p>
          
          <div className="flex justify-between gap-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <DeleteAccountModal 
        show={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />
    </>
  );
}

export default AccountModal;