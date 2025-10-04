import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  onClick,
  ...props 
}) => {
  const className = `button button--${variant} button--${size} ${disabled ? 'button--disabled' : ''}`.trim();
  
  return (
    <button 
      className={className}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
