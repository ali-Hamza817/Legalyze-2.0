import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useColorMode } from '../App';
import { PALETTES } from '../styles/themeConfig';

const ThemeSwitcher = () => {
  const { mode: currentTheme, setTheme, allThemes } = useColorMode();
  const handleThemeChange = () => {
    const currentIndex = allThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % allThemes.length;
    const nextTheme = allThemes[nextIndex];
    setTheme(nextTheme);
  };

  return (
    <Tooltip title={`Current Theme: ${PALETTES[currentTheme]?.name || currentTheme} (Click to change)`}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={handleThemeChange}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': { 
              bgcolor: 'action.selected',
              transform: 'rotate(45deg)'
            }
          }}
        >
          <ColorLensIcon color="primary" sx={{ fontSize: '1.2rem' }} />
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default ThemeSwitcher;
