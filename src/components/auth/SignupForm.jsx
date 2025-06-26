import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

function SignupForm({ onToggleLogin }) {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prenom || !email || !password || !confirmPassword) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    if (!consent) {
      setError("Merci de cocher la case de consentement parental.");
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(email, password, prenom);
      onToggleLogin();
      window.showMessageModal("Ton compte a bien été créé ! Tu peux maintenant te connecter.");
    } catch (error) {
      console.error("Signup error:", error);
      setError(getErrorMessage(error.code) || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/email-already-in-use": "Cet email est déjà utilisé par un autre compte.",
      "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
      "auth/invalid-email": "L'adresse email n'est pas valide."
    };
    
    return errorMessages[errorCode] || null;
  };

  const handleRgpdClick = (e) => {
    e.preventDefault();
    // Show RGPD modal
    document.getElementById('modal-rgpd')?.classList.add('show');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-center text-2xl font-bold mb-6">Créer un compte</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <Input
        type="text"
        id="prenom"
        label="Prénom"
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        required
      />
      
      <Input
        type="email"
        id="signup-email"
        label="Adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      
      <Input
        type="password"
        id="signup-password"
        label="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        showPasswordToggle
      />
      
      <Input
        type="password"
        id="signup-confirm"
        label="Confirmer le mot de passe"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        showPasswordToggle
      />
      
      <div className="flex items-start mt-4 mb-6">
        <input
          type="checkbox"
          id="checkbox-consent"
          className="mt-1 mr-2"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <label htmlFor="checkbox-consent" className="text-sm">
          J'atteste avoir l'accord d'un parent ou responsable légal pour l'utilisation de cette application et l'enregistrement de mes données, conformément à la{' '}
          <a href="#" onClick={handleRgpdClick} className="text-primary underline">
            politique de confidentialité
          </a>.
        </label>
      </div>
      
      <div className="flex justify-between gap-4 mt-6">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onToggleLogin} 
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
        >
          {loading ? 'Création...' : 'Valider'}
        </Button>
      </div>
    </form>
  );
}

export default SignupForm;