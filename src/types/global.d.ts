// Extensión del objeto Window global
interface Window {
  fs: {
    readFile: (path: string, options?: { encoding?: string }) => Promise<any>;
  };
  tokenHasIssues?: boolean; // Add the tokenHasIssues property
}
