import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStory } from '../../contexts/StoryContext';

function Rating({ storyId, readOnly = false, size = 'large' }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { rateStory, currentStory } = useStory();

  useEffect(() => {
    if (currentStory && currentStory.id === storyId && currentStory.note) {
      setRating(currentStory.note);
    }
  }, [currentStory, storyId]);

  const handleRatingClick = (value) => {
    if (readOnly) return;
    
    setRating(value);
    rateStory(storyId, value);
  };

  const starVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2 },
    tap: { scale: 0.9 },
    selected: { scale: 1.3 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className={`notation-container ${size === 'small' ? 'notation--small' : ''}`}>
      {!readOnly && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <strong>Tu as aimé cette histoire ?</strong>
        </motion.p>
      )}
      <motion.div 
        className="notation"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <motion.span
            key={value}
            className={`etoile ${value <= rating ? 'selected' : ''} ${
              size === 'small' ? 'text-base mx-0.5' : 'text-5xl mx-1.5'
            } cursor-pointer select-none text-yellow-400`}
            onClick={() => handleRatingClick(value)}
            onMouseEnter={() => !readOnly && setHoveredRating(value)}
            onMouseLeave={() => !readOnly && setHoveredRating(0)}
            variants={starVariants}
            animate={value <= rating ? "selected" : "initial"}
            whileHover={!readOnly ? "hover" : ""}
            whileTap={!readOnly ? "tap" : ""}
          >
            {value <= (hoveredRating || rating) ? '★' : '☆'}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export default Rating;