import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

function RgpdModal({ show, onClose }) {
  const [activeTab, setActiveTab] = useState('policy');
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always enabled
    functional: true,
    analytics: true,
    thirdParty: true
  });

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(cookiePreferences));
    onClose();
  };

  return (
    <Modal 
      show={show} 
      onClose={onClose}
      size="large"
      variant="cream"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 px-4 font-medium rounded-t-lg ${activeTab === 'policy' ? 'bg-primary-light text-primary font-bold' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('policy')}
          >
            Politique de confidentialité
          </button>
          <button
            className={`flex-1 py-2 px-4 font-medium rounded-t-lg ${activeTab === 'cookies' ? 'bg-primary-light text-primary font-bold' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('cookies')}
          >
            Cookies
          </button>
          <button
            className={`flex-1 py-2 px-4 font-medium rounded-t-lg ${activeTab === 'settings' ? 'bg-primary-light text-primary font-bold' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('settings')}
          >
            Paramètres
          </button>
        </div>

        {/* Tab content */}
        <div className="px-1">
          {activeTab === 'policy' && (
            <div>
              <h3 className="text-xl font-bold mb-2">Politique de confidentialité</h3>
              <div className="text-left">
                <p className="mb-4">
                  Ici figurera la politique de confidentialité et les informations sur la gestion des données personnelles.<br />
                  <b>(Texte à compléter plus tard !)</b>
                </p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Suppression ou rectification de vos données : <a href="mailto:support@monhistoire.fr" className="text-primary hover:underline">support@monhistoire.fr</a></li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div>
              <h3 className="text-xl font-bold mb-2">Politique de cookies</h3>
              <p className="text-sm mb-4">Dernière mise à jour : Juin 2025</p>
              
              <div className="text-left">
                <p className="mb-4">
                  Cette politique de cookies explique ce que sont les cookies et comment nous les utilisons. Vous devriez lire cette politique pour comprendre quels cookies nous utilisons, les informations que nous collectons et comment ces informations sont utilisées.
                </p>
                
                <h4 className="text-lg font-bold mt-4 mb-2">Qu'est-ce qu'un cookie ?</h4>
                <p className="mb-4">
                  Les cookies sont de petits fichiers texte stockés sur votre navigateur ou votre appareil par les sites web, les applications et les publicités que vous visitez. Ils sont largement utilisés pour faire fonctionner les sites web ou les faire fonctionner plus efficacement, ainsi que pour fournir des informations aux propriétaires du site.
                </p>
                
                {/* More cookie policy content would go here */}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="text-xl font-bold mb-2">Paramètres des cookies</h3>
              <p className="mb-4">
                Personnalisez vos préférences en matière de cookies. Les cookies essentiels ne peuvent pas être désactivés car ils sont nécessaires au fonctionnement de l'application.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="bg-white p-4 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.essential} 
                      disabled 
                      className="mr-3"
                    />
                    <div>
                      <strong className="block mb-1">Cookies essentiels</strong>
                      <p className="text-sm text-gray-600">Nécessaires au fonctionnement de l'application</p>
                    </div>
                  </label>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.functional} 
                      onChange={(e) => setCookiePreferences({...cookiePreferences, functional: e.target.checked})}
                      className="mr-3"
                    />
                    <div>
                      <strong className="block mb-1">Cookies fonctionnels</strong>
                      <p className="text-sm text-gray-600">Améliorent les fonctionnalités et la personnalisation</p>
                    </div>
                  </label>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.analytics} 
                      onChange={(e) => setCookiePreferences({...cookiePreferences, analytics: e.target.checked})}
                      className="mr-3"
                    />
                    <div>
                      <strong className="block mb-1">Cookies analytiques</strong>
                      <p className="text-sm text-gray-600">Nous aident à améliorer notre application</p>
                    </div>
                  </label>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.thirdParty} 
                      onChange={(e) => setCookiePreferences({...cookiePreferences, thirdParty: e.target.checked})}
                      className="mr-3"
                    />
                    <div>
                      <strong className="block mb-1">Cookies tiers</strong>
                      <p className="text-sm text-gray-600">Provenant de services externes</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <Button onClick={handleSavePreferences}>
                Enregistrer mes préférences
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}

export default RgpdModal;