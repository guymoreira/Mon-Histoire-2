import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-[15vh]">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="text-center bg-white/90 backdrop-blur-sm border-4 border-primary-light rounded-3xl shadow-xl">
          <motion.h1 
            className="text-5xl font-bold mb-8 text-primary-dark"
            variants={itemVariants}
          >
            Mon Histoire
          </motion.h1>
          
          <div className="flex flex-col gap-4 items-center">
            <motion.div variants={itemVariants}>
              <Button 
                onClick={() => navigate('/create-story')}
                className="max-w-xs text-xl py-4 rounded-full bg-gradient-to-r from-primary-light to-blue-400 hover:from-blue-400 hover:to-primary-light transition-all duration-300 transform hover:scale-105"
              >
                Créer une histoire
              </Button>
            </motion.div>
            
            {!currentUser && (
              <motion.div variants={itemVariants}>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/login')}
                  className="max-w-xs text-xl py-4 rounded-full bg-gradient-to-r from-secondary-light to-purple-400 hover:from-purple-400 hover:to-secondary-light transition-all duration-300 transform hover:scale-105"
                >
                  Me connecter
                </Button>
              </motion.div>
            )}
            
            {currentUser && (
              <motion.div variants={itemVariants}>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/my-stories')}
                  className="max-w-xs text-xl py-4 rounded-full bg-gradient-to-r from-secondary-light to-purple-400 hover:from-purple-400 hover:to-secondary-light transition-all duration-300 transform hover:scale-105"
                >
                  Mes Histoires
                </Button>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default Home;