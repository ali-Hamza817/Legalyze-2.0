import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getDesignTokens, getThemedCssVariables } from './styles/theme';
import { DEFAULT_THEME, PALETTES } from './styles/themeConfig';
import { AuthProvider } from './context/AuthContext';
import { ColorModeContext } from './context/ThemeContext'; // Import from new file
import './App.css';

// Components
import ThemeSwitcher from './components/ThemeSwitcher';
import SystemAnnouncement from './components/SystemAnnouncement';
import AdminLayout from './components/AdminLayout';

// Pages
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ChatInterface from './pages/ChatInterface';
import DocumentForm from './pages/DocumentForm';
import VerifyEmail from './pages/VerifyEmail';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import AdminDashboard from './pages/admin/Dashboard';
import KnowledgeBase from './pages/admin/KnowledgeBase';
import UserManagement from './pages/admin/UserManagement';
import PromptEngineering from './pages/admin/PromptEngineering';
import Analytics from './pages/admin/Analytics';
import LiveControlCenter from './pages/admin/LiveControlCenter';
import SystemInformation from './pages/admin/SystemInformation';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';


export const useColorMode = () => useContext(ColorModeContext);

const THEME_STORAGE_KEY = 'legalyze-theme';

function App() {
  // Load theme from localStorage or default
  const [activeTheme, setActiveTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedTheme && PALETTES[savedTheme]) ? savedTheme : DEFAULT_THEME;
  });

  const [customTheme, setCustomTheme] = useState(null);

  // Inject CSS Variables for global styles (App.css compatibility)
  useEffect(() => {
    // Check if it's a custom theme
    const isCustom = activeTheme === 'custom';
    // If custom and no custom theme data, revert to default
    if (isCustom && !customTheme) { 
        setActiveTheme(DEFAULT_THEME);
        return;
    }

    const cssVars = getThemedCssVariables(activeTheme, customTheme);
    const root = document.documentElement;
    
    // Apply variables to root
    Object.keys(cssVars).forEach(key => {
      root.style.setProperty(key, cssVars[key]);
    });

    // Save persistence
    localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
  }, [activeTheme, customTheme]);

  const colorMode = useMemo(
    () => ({
      setTheme: (themeKey) => {
        setActiveTheme(themeKey);
      },
      setCustomTheme: (palette) => {
        setCustomTheme(palette);
        setActiveTheme('custom');
      },
      mode: activeTheme,
      allThemes: Object.keys(PALETTES),
      customTheme: customTheme
    }),
    [activeTheme, customTheme],
  );

  const theme = useMemo(() => {
      if (activeTheme === 'custom' && customTheme) {
          // Create theme from custom palette
          // We need to shim the getDesignTokens to accept the raw object
          return createTheme(getDesignTokens('custom', customTheme));
      }
      return createTheme(getDesignTokens(activeTheme));
  }, [activeTheme, customTheme]);

  return (
    <AuthProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <SystemAnnouncement />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/document/:type" element={<DocumentForm />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/analytics" replace />} />
                <Route path="dashboard" element={<Navigate to="/admin/analytics" replace />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="live-control" element={<LiveControlCenter />} />
                <Route path="system-info" element={<SystemInformation />} />
                <Route path="knowledge-base" element={<KnowledgeBase />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
            {/* Theme Switcher removed - UI moved to LandingPage header */} 
          </Router>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AuthProvider>
  );
}

export default App;
