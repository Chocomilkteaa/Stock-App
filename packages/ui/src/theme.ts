/**
 * Shared Theme Configuration
 *
 * Centralized dark theme for the Stock-App.
 * All applications should import this theme from @repo/ui
 * to ensure consistent styling across the monorepo.
 */
import { createTheme } from "@mui/material";

/**
 * Dark theme with purple gradient accents.
 * Uses Inter/Roboto fonts for modern typography.
 */
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#667eea", // Purple-blue primary color
    },
    secondary: {
      main: "#764ba2", // Deep purple secondary color
    },
    background: {
      default: "#0f0f1a", // Dark navy background
      paper: "#1a1a2e", // Slightly lighter paper background
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
});
