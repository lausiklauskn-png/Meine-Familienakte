import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HealthPortal from "../app/health-portal";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HealthPortal />
  </StrictMode>,
);
