import React from 'react';
import './SpriteAvatar.css';

const SpriteAvatar = ({ index, className = '' }) => {
  // The sprite sheet is a 6x2 grid (6 columns, 2 rows).
  // Total 12 characters.
  const spriteUrl = 'https://as2.ftcdn.net/v2/jpg/19/25/48/25/1000_F_1925482512_f09V9wnaCy3LJX32CNd7xMF4c4k2j9NA.webp';
  
  // Calculate column and row based on index (0-11)
  let safeIndex = parseInt(index, 10);
  if (isNaN(safeIndex) || safeIndex < 0 || safeIndex > 11) {
    safeIndex = 0; // Default to first character
  }
  
  const col = safeIndex % 6;
  const row = Math.floor(safeIndex / 6);

  // Background position calculation:
  // For columns: 0%, 20%, 40%, 60%, 80%, 100%
  // For rows: 0%, 100%
  const bgX = col * 20;
  const bgY = row * 100;

  return (
    <div 
      className={`sprite-avatar-container ${className}`}
      style={{
        backgroundImage: `url(${spriteUrl})`,
        backgroundSize: '600% 200%',
        backgroundPosition: `${bgX}% ${bgY}%`,
      }}
      title={`Avatar ${safeIndex + 1}`}
    />
  );
};

export default SpriteAvatar;
