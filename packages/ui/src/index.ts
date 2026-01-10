/**
 * @repo/ui - Shared UI Components and Theming
 *
 * Central export point for all shared UI components and theming utilities.
 * Applications should import from this package to ensure consistency.
 */

// Shared components
export * from "./button";
export {
  DataDownloadForm,
  type DataDownloadFormProps,
} from "./DataDownloadForm";

// Re-export shared types for backward compatibility
export type { DataType } from "@repo/dto";

// Re-export MUI theming utilities for centralized imports
export { CssBaseline, ThemeProvider } from "@mui/material";

// Shared theme configuration
export { darkTheme } from "./theme";
