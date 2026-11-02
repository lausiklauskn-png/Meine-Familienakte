import { useState } from "react";
export function ProDokumentKnopf({ onUebernehmen }: { onUebernehmen: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return <button type="button" className="button secondary compact-button" disabled={busy} onClick={() => {
    setBusy(true); void onUebernehmen().finally(() => setBusy(false));
  }}>{busy ? "Original wird geprüft abgelegt …" : "In Pro-Tresor übernehmen"}</button>;
}
