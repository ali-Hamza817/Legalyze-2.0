export const PALETTES = {
  palette1: {
    name: 'Matcha Tea',
    mode: 'light',
    colors: ['#6B8E23', '#8FBC8F', '#F0FFF0', '#FFFFFF'],
    primary: '#6B8E23', // Olive Drab
    secondary: '#8FBC8F',
    accent: '#556B2F',
    background: '#F5F9F5',
    surface: '#FFFFFF',
    text: { primary: '#2F3C18', secondary: '#556B2F' }
  },
  palette2: {
    name: 'Seafoam Breeze',
    mode: 'light',
    colors: ['#2E8B57', '#66CDAA', '#E0FFFF', '#FFFFFF'],
    primary: '#2E8B57', // Sea Green
    secondary: '#66CDAA', // Medium Aquamarine
    accent: '#20B2AA', // Light Sea Green
    background: '#F0FFFF', // Azure
    surface: '#FFFFFF',
    text: { primary: '#004D40', secondary: '#2E8B57' }
  },
  palette3: {
    name: 'Olive Earth',
    mode: 'light',
    colors: ['#B17F59', '#A5B68D', '#C1CFA1', '#EDE8DC'],
    primary: '#B17F59',
    secondary: '#A5B68D',
    accent: '#C1CFA1',
    background: '#EDE8DC',
    surface: '#F8F6F2', // Lighter than bg
    text: {
      primary: '#4a332a', 
      secondary: '#6d8058',
    }
  },
  palette4: {
    name: 'Midnight Teal',
    mode: 'dark',
    colors: ['#222831', '#31363F', '#76ABAE', '#EEEEEE'],
    primary: '#76ABAE',
    secondary: '#31363F',
    accent: '#5F8A8D',
    background: '#222831',
    surface: '#31363F',
    text: {
      primary: '#EEEEEE',
      secondary: '#B8BCC0',
    }
  },
  palette5: {
    name: 'Emerald Essence', 
    mode: 'light', 
    colors: ['#2E8B57', '#3CB371', '#F0FFF4', '#FFFFFF'],
    primary: '#2E8B57', // SeaGreen
    secondary: '#3CB371', // MediumSeaGreen
    accent: '#20B2AA', // LightSeaGreen
    background: '#F0FFF4', // Honeydew (Very light green)
    surface: '#FFFFFF',
    text: { 
      primary: '#1B4D3E', // Dark Green Text
      secondary: '#2E8B57' 
    }
  },



  // Palette 13 removed per user request
  
  // palette8 removed

  palette14: {
    name: 'Azure Gold',
    mode: 'light',
    colors: ['#1A5F7A', '#DDBA7D', '#F4F9FC', '#FFFFFF'],
    primary: '#1A5F7A', // Much Darker Blue (Requested)
    secondary: '#DDBA7D', // Muted Gold
    accent: '#154c61', // Darkest Blue
    background: '#F4F9FC', 
    surface: '#FFFFFF',
    text: {
      primary: '#0E2A35', // Very Dark Blue
      secondary: '#1A5F7A'
    }
  },
  palette15: {
    name: 'Urban Minimal',
    mode: 'light',
    colors: ['#EFECE3', '#8FABD4', '#000000', '#1A1A1A'],
    primary: '#8FABD4', // Periwinkle
    secondary: '#000000', // Black
    accent: '#1A1A1A', // Off-Black
    background: '#EFECE3', // Bone/Off-white
    surface: '#FFFFFF',
    text: {
      primary: '#000000', // Black
      secondary: '#5F7C9D' // Muted Blue
    }
  },

  palette17: {
    name: 'Rustic Ocean',
    mode: 'light',
    colors: ['#EFE4D2', '#954C2E', '#254D70', '#F7F3EB'],
    primary: '#254D70', // Deep Blue
    secondary: '#954C2E', // Rust Red
    accent: '#EFE4D2', // Cream
    background: '#F7F3EB', // Warm Off-white
    surface: '#FFFFFF',
    text: {
      primary: '#254D70', // Deep Blue text
      secondary: '#954C2E'
    }
  },
  palette18: {
    name: 'Navy Cream',
    mode: 'light',
    colors: ['#F3F3E0', '#133E87', '#608BC1', '#CBDCEB'],
    primary: '#133E87', // Navy Blue
    secondary: '#608BC1', // Soft Blue
    accent: '#CBDCEB', // Pale Blue
    background: '#F3F3E0', // Cream White
    surface: '#FFFFFF',
    text: {
      primary: '#133E87', // Navy Text
      secondary: '#608BC1'
    }
  },

  palette21: {
    name: 'Taupe Steel',
    mode: 'light',
    colors: ['#948979', '#DFD0B8', '#3C5B6F', '#F5F5F0'],
    primary: '#3C5B6F', // Steel Blue
    secondary: '#948979', // Taupe
    accent: '#DFD0B8', // Beige
    background: '#F5F5F0', // Off White
    surface: '#FFFFFF',
    text: {
      primary: '#3C5B6F', // Steel Text
      secondary: '#948979'
    }
  }
};

export const DEFAULT_THEME = 'palette4';

// Helper to generate a palette object from diverse inputs
export const generatePalette = (input, name = 'Custom Theme') => {
    // If input is a string, it's a single hex (Legacy/Simple mode)
    if (typeof input === 'string') {
        const baseColor = input; 
        return {
            name: name,
            mode: 'light',
            colors: [baseColor, baseColor, '#FFFFFF', '#FFFFFF'],
            primary: baseColor,
            secondary: baseColor, 
            accent: baseColor,
            background: '#F5F5F5',
            surface: '#FFFFFF',
            text: { primary: '#000000', secondary: baseColor },
            isCustom: true
        };
    }

    // Advanced Object Mode
    /* Expected input: { primary, secondary, accent, background, surface, textMain } */
    return {
        name: name,
        mode: 'light',
        colors: [input.primary, input.secondary, input.accent, input.background],
        primary: input.primary,
        secondary: input.secondary,
        accent: input.accent,
        background: input.background,
        surface: input.surface,
        text: {
            primary: input.textMain,
            secondary: input.secondary
        },
        isCustom: true
    };
};
