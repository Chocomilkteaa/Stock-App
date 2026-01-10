/**
 * Main App Component
 *
 * Entry point for the Stock-App web application.
 * Renders the Data Download Center for fetching stock data.
 */
import {
  DataDownloadForm,
  CssBaseline,
  ThemeProvider,
  darkTheme,
} from "@repo/ui";

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      {/* CSS Reset for consistent styling */}
      <CssBaseline />

      {/* Main content container */}
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background:
            "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
        }}
      >
        {/* Data Download Form Component */}
        <DataDownloadForm apiBaseUrl="http://localhost:8080" />
      </main>
    </ThemeProvider>
  );
}

export default App;
