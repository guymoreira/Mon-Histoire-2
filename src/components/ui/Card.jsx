import React from 'react';
import classNames from 'classnames';

function Card({ 
  children, 
  variant = 'cream', 
  size = 'medium', 
  padding = 'medium',
  className,
  ...props 
}) {
  const cardClasses = classNames(
    'ui-card',
    {
      'bg-cream': variant === 'cream',
      'bg-white': variant === 'white',
      'max-w-sm': size === 'small',
      'max-w-md': size === 'medium',
      'max-w-lg': size === 'large',
      'p-3': padding === 'small',
      'p-4': padding === 'medium',
      'p-8': padding === 'large'
    },
    className
  );

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}

export default Card;