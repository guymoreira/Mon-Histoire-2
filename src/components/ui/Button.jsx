import { forwardRef } from 'react';
import classNames from 'classnames';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'medium',
  className,
  fullWidth = true,
  disabled = false,
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const buttonClasses = classNames(
    'ui-button',
    {
      'ui-button--primary': variant === 'primary',
      'ui-button--secondary': variant === 'secondary',
      'w-full': fullWidth,
      'w-auto px-6': !fullWidth,
      'opacity-50 cursor-not-allowed': disabled
    },
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled}
      type={type}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;