import * as React from 'react';

const ThemeContext = React.createContext();

export const useTheme = () => {
  // Return a simple object without any state
  return {
    isDarkMode: false,
    toggleTheme: () => {},
    theme: 'light'
  };
};

export const ThemeProvider = ({ children }) => {
  // Simple provider without state
  const value = {
    isDarkMode: true,
    toggleTheme: () => {},
    theme: 'dark'  
  };

  return React.createElement(
    ThemeContext.Provider,
    { value },
    children
  );
}; 