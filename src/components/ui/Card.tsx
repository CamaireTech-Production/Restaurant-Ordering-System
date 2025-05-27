import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const baseClasses = 'bg-white rounded-lg shadow-md overflow-hidden';
  const classes = `${baseClasses} ${className}`;
  
  const isClickable = !!onClick;
  
  if (isClickable) {
    return (
      <motion.div
        className={`${classes} cursor-pointer transition-shadow hover:shadow-lg`}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    );
  }
  
  return <div className={classes}>{children}</div>;
};

export default Card;