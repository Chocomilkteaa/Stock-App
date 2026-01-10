import { RepoButton } from "@repo/ui";

function App() {
  return (
    <div>
      <h1>Monorepo Web App</h1>
      <RepoButton label="Click Me" onClick={() => alert("Clicked!")} />
    </div>
  );
}

export default App;
