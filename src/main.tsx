import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HealthPortal from "../app/health-portal";
import { FileViewerHost } from "../app/file-viewer";
import { PageDialogHost } from "../app/page-dialogs";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HealthPortal />
    <FileViewerHost />
    <PageDialogHost />
  </StrictMode>,
);
