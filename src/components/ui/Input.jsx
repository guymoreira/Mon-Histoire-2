import React, { useState } from 'react';
import classNames from 'classnames';

function Input({
  type = 'text',
  label,
  id,
  className,
  error,
  showPasswordToggle = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  
  const inputClasses = classNames(
    'ui-input',
    { 'border-red-500': error },
    className
  );

  const togglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="ui-form-group">
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}
        </label>
      )}
      
      <div className={showPasswordToggle ? "ui-input-group" : undefined}>
        <input
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          id={id}
          className={inputClasses}
          {...props}
        />
        
        {showPasswordToggle && (
          <span 
            className="ui-input-icon" 
            onClick={togglePassword}
            role="button"
            tabIndex={0}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

export default Input;