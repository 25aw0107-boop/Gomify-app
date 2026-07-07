import React, { createContext, useState, ReactNode, useContext } from 'react';

export type ThemeType = 'natural' | 'night' | 'cute' | 'cafe';

type ThemePalette = {
  colors: {
    background: string;
    card: string;
    primary: string;
    text: string;
    border: string;
  };
};

const themes: Record<ThemeType, ThemePalette> = {
  natural: {
    colors: {
      background: '#F5F5F5',
      card: '#FFFFFF',
      primary: '#6BAC7A',
      text: '#000000',
      border: '#EAEAEA',
    },
  },

  cute: {
    colors: {
      background: '#FDF8F5',
      card: '#FFFDFB',
      primary: '#A8CFA4',
      text: '#6B4E3C',
      border: '#E8DED5',
    },
  },

  cafe: {
    colors: {
      background: '#F8F3EC',
      card: '#FFFFFF',
      primary: '#8B6B4A',
      text: '#4F3727',
      border: '#DDD0C3',
    },
  },

  night: {
    colors: {
      background: '#1F1F1F',
      card: '#1C2432',
      primary: '#8BC34A',
      text: '#A6C56F',
      border: '#444444',
    },
  },
};

interface ThemeContextType {
  theme: ThemePalette;
  setTheme: (theme: ThemeType) => void;
  selectedDesign: ThemeType;
  setSelectedDesign: (theme: ThemeType) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: themes.natural,
  setTheme: () => {},
  selectedDesign: 'natural',
  setSelectedDesign: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeType>('natural');
  const [selectedDesign, setSelectedDesign] = useState<ThemeType>('natural');

  const setTheme = (nextTheme: ThemeType) => {
    setThemeName(nextTheme);
    setSelectedDesign(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], setTheme, selectedDesign, setSelectedDesign }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme måste användas inom en ThemeProvider');
  return context;
};