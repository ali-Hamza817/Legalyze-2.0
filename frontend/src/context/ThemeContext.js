import { createContext, useContext } from 'react';

export const ColorModeContext = createContext({ 
  toggleColorMode: () => {},
  mode: 'light',
  setTheme: () => {},
  allThemes: []
});

export const useColorMode = () => useContext(ColorModeContext);
