import { createTheme } from '@mui/material/styles';
import { PALETTES, DEFAULT_THEME } from './themeConfig';

// Helper to generate CSS variables for the active theme
export const getThemedCssVariables = (paletteKey, customPalette = null) => {
    const config = (paletteKey === 'custom' && customPalette) 
        ? customPalette 
        : (PALETTES[paletteKey] || PALETTES[DEFAULT_THEME]);
    
    // We map the semantic tokens to the CSS variables used in App.css
    return {
        '--bg-primary': config.background,
        '--bg-secondary': config.surface,
        '--accent': config.accent,
        '--primary': config.primary, 
        '--secondary': config.secondary,
        '--text-light': config.mode === 'dark' ? config.text.primary : config.background, 
        '--text-main': config.text.primary, 
        '--text-sub': config.text.secondary, 
        
        // Fix for legacy App.css usage:
        '--text-light': config.text.primary, 
        '--text-dark': config.text.secondary,

        // Gradients (auto-generated based on primary/secondary)
        '--primary-gradient': (paletteKey === 'palette4' || (paletteKey.startsWith('palette') && parseInt(paletteKey.replace('palette', '')) >= 7)) 
            ? config.primary 
            : `linear-gradient(135deg, ${config.primary} 0%, ${config.secondary} 100%)`,
            
        '--secondary-gradient': (paletteKey === 'palette4' || (paletteKey.startsWith('palette') && parseInt(paletteKey.replace('palette', '')) >= 7))
            ? config.secondary
            : `linear-gradient(135deg, ${config.secondary} 0%, ${config.accent} 100%)`,
        
        // Glassmorphism
        '--glass-bg': config.mode === 'dark' 
            ? `rgba(${hexToRgb(config.surface)}, 0.7)` 
            : `rgba(${hexToRgb(config.surface)}, 0.8)`,
        '--glass-border': config.mode === 'dark'
            ? `rgba(${hexToRgb(config.text.primary)}, 0.1)`
            : `rgba(${hexToRgb(config.text.primary)}, 0.05)`,
    };
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
};

export const getDesignTokens = (paletteKey, customPalette = null) => {
    const config = (paletteKey === 'custom' && customPalette)
        ? customPalette
        : (PALETTES[paletteKey] || PALETTES[DEFAULT_THEME]);
    const { mode, primary, secondary, accent, background, surface, text } = config;

    return {
        palette: {
            mode,
            primary: {
                main: primary,
                light: secondary, // approximate
                dark: accent,     // approximate
            },
            secondary: {
                main: secondary,
                light: primary,
                dark: accent,
            },
            accent: {
                main: accent,
            },
            background: {
                default: background,
                paper: surface,
            },
            text: {
                primary: text.primary,
                secondary: text.secondary,
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 800, letterSpacing: '-0.02em' },
            h2: { fontWeight: 700, letterSpacing: '-0.01em' },
            h3: { fontWeight: 700, letterSpacing: '-0.01em' },
            button: { fontWeight: 600, textTransform: 'none' },
        },
        shape: {
            borderRadius: 1,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '1px',
                        padding: '10px 24px',
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        },
                    },
                    containedPrimary: {
                        background: primary,
                        color: '#FFFFFF', // Ensure white text for better visibility (User request for Midnight Teal)
                        '&:hover': {
                            background: secondary,
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: '1px',
                        backgroundImage: 'none',
                        backgroundColor: surface,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '1px',
                            backgroundColor: mode === 'dark' ? surface : background, // Slightly different context
                            '& fieldset': {
                                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            },
                            '&:hover fieldset': {
                                borderColor: primary,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: primary,
                            },
                        },
                    },
                },
            },
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarColor: `${primary} ${surface}`,
                        "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                            backgroundColor: surface,
                        },
                        "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                            borderRadius: 8,
                            backgroundColor: primary,
                            minHeight: 24,
                            border: `3px solid ${surface}`,
                        },
                        "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
                            backgroundColor: secondary,
                        },
                        "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
                            backgroundColor: secondary,
                        },
                        "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
                            backgroundColor: secondary,
                        },
                        "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
                            backgroundColor: surface,
                        },
                    },
                },
            },
        },
    };
};

// Default theme instance
const theme = createTheme(getDesignTokens(DEFAULT_THEME));
export default theme;
