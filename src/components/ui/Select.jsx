import { forwardRef } from 'react';
import classNames from 'classnames';

const Select = forwardRef(({
  label,
  id,
  options = [],
  className,
  error,
  ...props
}, ref) => {
  const selectClasses = classNames(
    'ui-input',
    { 'border-red-500': error },
    className
  );

  return (
    <div className="ui-form-group">
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        id={id}
        className={selectClasses}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;