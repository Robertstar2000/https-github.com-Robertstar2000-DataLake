

import React from 'react';

// FIX: Update CardProps to inherit all standard div attributes (e.g., draggable, onDragStart)
// by extending React's built-in HTMLAttributes for a div element.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div 
      className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 ${className}`}
      // FIX: Spread the rest of the props onto the div to pass them through.
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
