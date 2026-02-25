const Card = ({ children, className = '', padding = 'p-6', shadow = 'shadow-sm', rounded = 'rounded-xl' }) => {
  return (
    <div className={`bg-white ${shadow} ${rounded} ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
