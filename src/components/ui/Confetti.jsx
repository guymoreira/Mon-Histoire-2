import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function Confetti({ duration = 3000 }) {
  const [pieces, setPieces] = useState([]);
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    // Generate random confetti pieces
    const colors = ['#79d4e7', '#d5b8f6', '#ffcc5c', '#ff6b6b', '#c3e88d'];
    const newPieces = [];
    
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 10,
        size: 5 + Math.random() * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5
      });
    }
    
    setPieces(newPieces);
    
    // Hide after duration
    const timer = setTimeout(() => {
      setShow(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(piece => (
        <motion.div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: '2px',
            transform: `rotate(${piece.rotation}deg)`
          }}
          animate={{
            y: ['0%', '100%'],
            x: [`${piece.x}%`, `${piece.x + (Math.random() * 20 - 10)}%`],
            rotate: [piece.rotation, piece.rotation + (Math.random() * 360)]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: 'easeOut',
            delay: piece.delay
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;