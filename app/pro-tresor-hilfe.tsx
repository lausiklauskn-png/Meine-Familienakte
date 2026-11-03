/** „Wo liegt was?“ – gleicher Inhalt in jeder Pro-App (gemeinsamer Plan, Klaus 2026-11-03), darunter app-spezifisch. */
export const PRO_TRESOR_FACH = "Familienakte";
export const PRO_TRESOR_EINGANG = "Eingang-Familienakte";
export const PRO_TRESOR_MENUEWEG = "Dokumente → Sicherheit & lokaler Tresor → Karte „Gemeinsamer Pro-Tresor“ → „Vorhandenen Pro-Tresor verbinden …“";

export function ProTresorWoLiegtWas({ open = false }: { open?: boolean }) {
  return <details data-pro-tresor-hilfe open={open}>
    <summary>Wo liegt was?</summary>
    <ul>
      <li>Der gemeinsame Tresor aller Pro-Apps ist der Ordner, in dem die Datei „tresorordner.json“ liegt (bei Klaus: SD-Karte › Privat Brain Pro Hauptablageordner). Diesen Ordner wählst du in jeder App einmal aus.</li>
      <li>Nie den Unterordner „Tresorordner“ wählen und nie einen App-Ordner darin.</li>
      <li>Darin legt jede App ihren eigenen Ordner an: Workflow PDF Pro · Private Brain · BookLedgerPro · Familienakte.</li>
      <li>Die Ordner „Eingang-…“ sind Briefkästen: Andere Apps legen dort etwas für diese App ab.</li>
      <li>Die Dateien heißen nur nach Nummern und sind verschlüsselt. Den echten Namen zeigt die App. Ohne App lassen sie sich nicht öffnen.</li>
      <li>Offene Dateien (PDF, .json, .txt) gehören nicht in den Tresor-Ordner. Ersatzschlüssel ausdrucken oder getrennt aufbewahren.</li>
      <li>Ein Passwort gilt für alle Pro-Apps.</li>
    </ul>
    <p><strong>Diese App:</strong> {PRO_TRESOR_FACH} · <strong>Eingang:</strong> {PRO_TRESOR_EINGANG}</p>
    <p><strong>Verbinden:</strong> {PRO_TRESOR_MENUEWEG}. Der Ordner „{PRO_TRESOR_FACH}“ entsteht erst, wenn die erste Originaldatei im Pro-Tresor abgelegt wird.</p>
  </details>;
}
