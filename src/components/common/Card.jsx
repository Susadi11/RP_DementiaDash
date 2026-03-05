const Card = ({ children, className = '', padding = 'p-6', shadow = 'shadow-glass-sm', rounded = 'rounded-2xl', onClick }) => {
  return (
    <div
      className={`glass ${shadow} ${rounded} ${padding} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
