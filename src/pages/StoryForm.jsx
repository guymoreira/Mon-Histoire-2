import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import StoryFormComponent from '../components/story/StoryForm';

function StoryForm() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-4 border-primary-light rounded-3xl shadow-xl">
        <StoryFormComponent />
      </Card>
    </motion.div>
  );
}

export default StoryForm;