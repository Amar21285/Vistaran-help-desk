import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorTheme = 'default' | 'emerald' | 'crimson' | 'royal' | 'sunset';
type FontFamily = 'sans' | 'serif' | 'mono' | 'modern' | 'elegant';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  resetTheme: () => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const FONT_MAP: Record<FontFamily, string> = {
  sans: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  modern: "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
  elegant: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif"
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('default');
  const [wallpaper, setWallpaperState] = useState<string>('');
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('sans');

  const applyTheme = useCallback((themeToApply: Theme, colorThemeToApply: ColorTheme, fontToApply: FontFamily) => {
    let currentTheme: 'light' | 'dark';
    
    if (themeToApply === 'system') {
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      currentTheme = themeToApply;
    }

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(currentTheme);
    document.documentElement.setAttribute('data-theme', colorThemeToApply);
    
    // Update the CSS variable on the document root
    document.documentElement.style.setProperty('--font-family', FONT_MAP[fontToApply]);
    
    setResolvedTheme(currentTheme);
  }, []);

  useEffect(() => {
    try {
        const savedTheme = localStorage.getItem('vistaran-helpdesk-theme') as Theme | null;
        const savedColorTheme = localStorage.getItem('vistaran-helpdesk-color-theme') as ColorTheme | null;
        const savedWallpaper = localStorage.getItem('vistaran-helpdesk-wallpaper') || '';
        const savedFont = localStorage.getItem('vistaran-helpdesk-font') as FontFamily | null;
        
        const initialTheme = savedTheme || 'system';
        const initialColorTheme = savedColorTheme || 'default';
        const initialFont = savedFont || 'sans';
        
        setThemeState(initialTheme);
        setColorThemeState(initialColorTheme);
        setWallpaperState(savedWallpaper);
        setFontFamilyState(initialFont);
        applyTheme(initialTheme, initialColorTheme, initialFont);
    } catch (error) {
        console.error("Failed to load theme from localStorage", error);
        applyTheme('system', 'default', 'sans');
    }
  }, [applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system', colorTheme, fontFamily);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, colorTheme, fontFamily, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('vistaran-helpdesk-theme', newTheme);
    applyTheme(newTheme, colorTheme, fontFamily);
  };
  
  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
    localStorage.setItem('vistaran-helpdesk-color-theme', newColorTheme);
    applyTheme(theme, newColorTheme, fontFamily);
  }

  const setWallpaper = (url: string) => {
    setWallpaperState(url);
    localStorage.setItem('vistaran-helpdesk-wallpaper', url);
  }

  const setFontFamily = (newFont: FontFamily) => {
    setFontFamilyState(newFont);
    localStorage.setItem('vistaran-helpdesk-font', newFont);
    applyTheme(theme, colorTheme, newFont);
  }

  const resetTheme = useCallback(() => {
    setTheme('system');
    setColorTheme('default');
    setWallpaper('');
    setFontFamily('sans');
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, resolvedTheme, resetTheme, 
      colorTheme, setColorTheme, wallpaper, setWallpaper,
      fontFamily, setFontFamily 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};