import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../../contexts/StoryContext';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Confetti from '../ui/Confetti';

function StoryForm() {
  const { generateStory, storyFormData, setStoryFormData } = useStory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
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
      
      // Show confetti
      setShowConfetti(true);
      
      // Generate the story
      await generateStory(formData);
      
      // Navigate to result page after a short delay
      setTimeout(() => {
        navigate('/story-result');
      }, 1000);
    } catch (error) {
      console.error("Error generating story:", error);
      setError(error.message || "Erreur lors de la génération de l'histoire.");
      setShowConfetti(false);
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="w-full max-w-md mx-auto"
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <motion.h2 
        className="text-3xl font-bold text-center mb-8 text-primary-dark"
        variants={itemVariants}
      >
        Créer une Histoire
      </motion.h2>
      
      {error && (
        <motion.div 
          className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6"
          variants={itemVariants}
        >
          {error}
        </motion.div>
      )}
      
      <motion.div variants={itemVariants}>
        <Input
          type="text"
          id="heroPrenom"
          name="heroPrenom"
          label="Prénom du héros"
          value={formData.heroPrenom}
          onChange={handleChange}
          required
          className="border-2 border-primary-light focus:border-primary focus:ring-2 focus:ring-primary-light/50 rounded-xl"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
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
          className="border-2 border-primary-light focus:border-primary focus:ring-2 focus:ring-primary-light/50 rounded-xl"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
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
          className="border-2 border-primary-light focus:border-primary focus:ring-2 focus:ring-primary-light/50 rounded-xl"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
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
          className="border-2 border-primary-light focus:border-primary focus:ring-2 focus:ring-primary-light/50 rounded-xl"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
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
          className="border-2 border-primary-light focus:border-primary focus:ring-2 focus:ring-primary-light/50 rounded-xl"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
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
          className="border-2 border-primary-light focus:border-primary focus:ring-2 focus:ring-primary-light/50 rounded-xl"
        />
      </motion.div>
      
      <motion.div 
        className="flex justify-between gap-4 mt-10"
        variants={itemVariants}
      >
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => navigate('/')}
          disabled={loading}
          className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 shadow-md"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
          className="bg-gradient-to-r from-primary-light to-blue-400 hover:from-blue-400 hover:to-primary-light shadow-md"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Génération...
            </span>
          ) : (
            "C'est parti ! ✨"
          )}
        </Button>
      </motion.div>
      
      {showConfetti && <Confetti />}
    </motion.form>
  );
}

export default StoryForm;