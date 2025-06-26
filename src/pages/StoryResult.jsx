import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import StoryDisplay from '../components/story/StoryDisplay';

function StoryResult() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-4 border-primary-light rounded-3xl shadow-xl">
        <StoryDisplay />
      </Card>
    </motion.div>
  );
}

export default StoryResult;