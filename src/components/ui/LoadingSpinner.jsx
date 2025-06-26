import React from 'react';

function LoadingSpinner({ size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };
  
  const spinnerClass = `${sizeClasses[size]} ${className} inline-block rounded-full border-gray-200 border-t-primary-light animate-spin`;
  
  return (
    <div className="flex justify-center">
      <div className={spinnerClass}></div>
    </div>
  );
}

export default LoadingSpinner;