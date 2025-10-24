
import React, { useContext } from 'react';
import { ErrorContext } from '../contexts/ErrorContext';

const ErrorHeader: React.FC = () => {
  const { errors, removeError } = useContext(ErrorContext);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-900/50 border-b border-red-500/30 text-red-300 text-sm p-2 space-y-1">
      {errors.map(error => (
        <div key={error.id} className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error.message}</span>
          </div>
          <button
            onClick={() => removeError(error.id)}
            className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center font-bold text-red-200"
            aria-label={`Dismiss error: ${error.message}`}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorHeader;
