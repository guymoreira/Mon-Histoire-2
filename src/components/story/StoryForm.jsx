import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../../contexts/StoryContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

function StoryForm() {
  const { generateStory, storyFormData, setStoryFormData } = useStory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Initialize form with saved data or defaults
  const [formData, setFormData] = useState({
    heroPrenom: storyFormData.heroPrenom || localStorage.getItem('prenom_heros') || '',
    personnage: storyFormData.personnage || 'fille',
    lieu: storyFormData.lieu || 'foret_enchantee',
    objet: storyFormData.objet || 'baguette_magique',
    compagnon: storyFormData.compagnon || 'dragon',
    objectif: storyFormData.objectif || 'sauver_un_village'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.heroPrenom || !formData.personnage || !formData.lieu) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Save hero name to localStorage
      localStorage.setItem('prenom_heros', formData.heroPrenom);
      
      // Save form data to context
      setStoryFormData(formData);
      
      // Generate the story
      await generateStory(formData);
      
      // Navigate to result page
      navigate('/story-result');
    } catch (error) {
      console.error("Error generating story:", error);
      setError(error.message || "Erreur lors de la génération de l'histoire.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Créer une Histoire</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <Input
        type="text"
        id="heroPrenom"
        name="heroPrenom"
        label="Prénom du héros"
        value={formData.heroPrenom}
        onChange={handleChange}
        required
      />
      
      <Select
        id="personnage"
        name="personnage"
        label="Personnage :"
        value={formData.personnage}
        onChange={handleChange}
        required
        options={[
          { value: 'fille', label: 'Fille' }
        ]}
      />
      
      <Select
        id="lieu"
        name="lieu"
        label="Lieu / Décor :"
        value={formData.lieu}
        onChange={handleChange}
        required
        options={[
          { value: 'foret_enchantee', label: 'Forêt enchantée' },
          { value: 'chateau_ancien', label: 'Château ancien' },
          { value: 'ile_perdue', label: 'Île perdue' }
        ]}
      />
      
      <Select
        id="objet"
        name="objet"
        label="Objet magique :"
        value={formData.objet}
        onChange={handleChange}
        required
        options={[
          { value: 'baguette_magique', label: 'Baguette magique' },
          { value: 'epee_legendaire', label: 'Épée légendaire' },
          { value: 'bouclier_enchante', label: 'Bouclier enchanté' }
        ]}
      />
      
      <Select
        id="compagnon"
        name="compagnon"
        label="Compagnon (optionnel) :"
        value={formData.compagnon}
        onChange={handleChange}
        options={[
          { value: 'dragon', label: 'Dragon' },
          { value: 'licorne', label: 'Licorne' },
          { value: 'lion_majestueux', label: 'Lion majestueux' }
        ]}
      />
      
      <Select
        id="objectif"
        name="objectif"
        label="Objectif / Mission :"
        value={formData.objectif}
        onChange={handleChange}
        required
        options={[
          { value: 'sauver_un_village', label: 'Sauver un village' },
          { value: 'decouvrir_un_tresor_cache', label: 'Découvrir un trésor caché' },
          { value: 'retrouver_un_ami_perdu', label: 'Retrouver un ami perdu' }
        ]}
      />
      
      <div className="flex justify-between gap-4 mt-8">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => navigate('/')}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
        >
          {loading ? 'Génération...' : "C'est parti !"}
        </Button>
      </div>
    </form>
  );
}

export default StoryForm;