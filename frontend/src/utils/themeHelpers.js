/**
 * Theme helper utilities
 */

export const getThemeColor = (mode, darkColor, lightColor, earthToneColor = null) => {
  if (mode === 'dark') return darkColor;
  if (mode === 'earthTone') return earthToneColor || lightColor;
  return lightColor;
};

export const isDarkTheme = (mode) => mode === 'dark';
export const isLightTheme = (mode) => mode === 'light' || mode === 'earthTone';
export const isEarthTone = (mode) => mode === 'earthTone';


