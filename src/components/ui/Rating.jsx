import { useState, useEffect } from 'react';
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

  const starClasses = `
    ${size === 'small' ? 'text-base mx-0.5' : 'text-5xl mx-1.5'} 
    cursor-pointer select-none text-yellow-400 transition-transform duration-200 ease-in-out
  `;

  return (
    <div className={`notation-container ${size === 'small' ? 'notation--small' : ''}`}>
      {!readOnly && <p><strong>Tu as aimé cette histoire ?</strong></p>}
      <div className="notation">
        {[1, 2, 3, 4, 5].map((value) => (
          <span
            key={value}
            className={`etoile ${value <= rating ? 'selected' : ''} ${starClasses}`}
            onClick={() => handleRatingClick(value)}
            onMouseEnter={() => !readOnly && setHoveredRating(value)}
            onMouseLeave={() => !readOnly && setHoveredRating(0)}
          >
            {value <= (hoveredRating || rating) ? '★' : '☆'}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Rating;