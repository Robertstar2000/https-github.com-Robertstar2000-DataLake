
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div 
      className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
