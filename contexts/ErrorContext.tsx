
import React, { createContext, useState, useCallback } from 'react';

export interface AppError {
  id: string;
  message: string;
  source: string; // e.g., 'WorkflowManager'
}

interface ErrorContextType {
  errors: AppError[];
  addError: (message: string, source: string) => void;
  removeError: (id: string) => void;
  clearErrorsBySource: (source: string) => void;
}

export const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  addError: () => {},
  removeError: () => {},
  clearErrorsBySource: () => {},
});

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((message: string, source: string) => {
    const newError: AppError = {
      id: `err-${source}-${Date.now()}`,
      message,
      source,
    };
    setErrors(prevErrors => {
        // Avoid adding duplicate messages from the same source
        if (prevErrors.some(e => e.message === message && e.source === source)) {
            return prevErrors;
        }
        return [...prevErrors, newError];
    });
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== id));
  }, []);

  const clearErrorsBySource = useCallback((source: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.source !== source));
  }, []);

  const value = {
    errors,
    addError,
    removeError,
    clearErrorsBySource,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};
