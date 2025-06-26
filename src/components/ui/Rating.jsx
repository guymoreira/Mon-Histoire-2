import React, { useState, useEffect } from 'react';
import { useStory } from '../../contexts/StoryContext';

function Rating({ storyId, readOnly = false, size = 'large' }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { rateStory, currentStory, stories } = useStory();

  useEffect(() => {
    // Try to find the story in the stories array first
    const story = stories.find(s => s.id === storyId);
    
    if (story && typeof story.note === 'number') {
      setRating(story.note);
    } else if (currentStory && currentStory.id === storyId && typeof currentStory.note === 'number') {
      setRating(currentStory.note);
    }
  }, [currentStory, storyId, stories]);

  const handleRatingClick = (value) => {
    if (readOnly) return;
    
    setRating(value);
    rateStory(storyId, value);
  };

  return (
    <div className={`notation-container ${size === 'small' ? 'notation--small' : ''}`}>
      {!readOnly && (
        <p>
          <strong>Tu as aimé cette histoire ?</strong>
        </p>
      )}
      <div className="notation">
        {[1, 2, 3, 4, 5].map((value) => (
          <span
            key={value}
            className={`etoile ${value <= rating ? 'selected' : ''}`}
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