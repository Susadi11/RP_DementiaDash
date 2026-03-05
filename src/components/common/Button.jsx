const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false
}) => {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]';

  const variants = {
    primary: 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-glow focus:ring-primary disabled:opacity-50 hover:brightness-110',
    secondary: 'glass text-gray-800 hover:bg-white/80 focus:ring-secondary',
    outline: 'border border-primary/30 text-primary hover:bg-primary/5 focus:ring-primary bg-white/50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg focus:ring-red-500',
    ghost: 'text-primary hover:bg-primary/5 font-medium'
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
