import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

function LoginForm({ onToggleSignup, onToggleReset }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (error) {
      console.error("Login error:", error);
      setError(getErrorMessage(error.code) || "Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      "auth/invalid-credential": "Email ou mot de passe incorrect.",
      "auth/user-not-found": "Aucun compte ne correspond à cet email.",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/too-many-requests": "Trop de tentatives. Veuillez réessayer plus tard."
    };
    
    return errorMessages[errorCode] || null;
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-center text-2xl font-bold mb-6">Connexion</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <Input
        type="email"
        id="email"
        label="Adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="username"
      />
      
      <Input
        type="password"
        id="password"
        label="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        showPasswordToggle
      />
      
      <div className="flex justify-between gap-4 mt-6">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => window.history.back()} 
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </div>
      
      <div className="text-center mt-6">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onToggleSignup} 
          disabled={loading}
        >
          Créer un compte
        </Button>
        
        <button 
          type="button" 
          className="block mx-auto mt-2 text-primary hover:underline text-sm"
          onClick={onToggleReset}
          disabled={loading}
        >
          Mot de passe oublié ?
        </button>
      </div>
    </form>
  );
}

export default LoginForm;