import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import HealthPortal from "../app/health-portal";
import { FileViewerHost } from "../app/file-viewer";
import { PageDialogHost } from "../app/page-dialogs";
import "../app/globals.css";

// Fehlergrenze (A11): Ein Darstellungsfehler ergibt keine weiße Seite mehr. In der App auf dem Handy oder unter
// Windows gibt es keine Adressleiste zum Neuladen, deshalb steht der Knopf hier. Daten liegen im Datentresor
// und sind davon nicht betroffen.
class Fehlergrenze extends Component<{ children: ReactNode }, { fehler: Error | null }> {
  state = { fehler: null as Error | null };
  static getDerivedStateFromError(fehler: Error) { return { fehler }; }
  componentDidCatch(fehler: Error, info: ErrorInfo) { console.error("Familienakte: Darstellungsfehler", fehler, info.componentStack); }
  render() {
    if (!this.state.fehler) return this.props.children;
    return <main className="app-fehlergrenze" role="alert">
      <h1>Die Seite konnte nicht angezeigt werden.</h1>
      <p>Deine Unterlagen und Einträge bleiben sicher im Datentresor. Bitte die Familienakte neu laden.</p>
      <p><button type="button" className="button primary" onClick={() => window.location.reload()}>Neu laden</button></p>
      <details><summary>Technische Angabe</summary><pre>{String(this.state.fehler?.message || this.state.fehler)}</pre></details>
    </main>;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fehlergrenze>
      <HealthPortal />
      <FileViewerHost />
      <PageDialogHost />
    </Fehlergrenze>
  </StrictMode>,
);
