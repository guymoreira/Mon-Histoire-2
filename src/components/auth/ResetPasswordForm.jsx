import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

function ResetPasswordForm({ onToggleLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage("Lien de réinitialisation envoyé !");
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Erreur lors de l'envoi du lien de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-center text-2xl font-bold mb-6">Réinitialisation</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      <Input
        type="email"
        id="reset-email"
        label="Votre adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      
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
          {loading ? 'Envoi...' : 'Envoyer'}
        </Button>
      </div>
    </form>
  );
}

export default ResetPasswordForm;