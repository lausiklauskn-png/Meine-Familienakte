// Einziger Netzweg des Pseudo-Fensters: Mistral (EU) mit eigenem Schlüssel, nur nach der Rückfrage „N verdeckt – senden?“ und nur
// mit der fertigen Fassung (Platzhalter, keine Zuordnung). Getrennt von app/pseudo-knopf.tsx, damit die Maske selbst nachweislich
// keinen Netzaufruf hat (Probe scripts/run-maske-tests.mjs prüft beides).
import { MISTRAL_ADRESSE } from "../lib/brief-antwort";

export async function mistralSenden(schluessel: string, system: string, fassung: string): Promise<string> {
  const r = await fetch(MISTRAL_ADRESSE, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${schluessel.trim()}` },
    body: JSON.stringify({ model: "mistral-small-latest", temperature: 0.2, messages: [{ role: "system", content: system }, { role: "user", content: fassung }] }) });
  if (!r.ok) throw new Error(r.status === 401 ? "Der Schlüssel wurde abgelehnt." : `Antwort ${r.status}.`);
  const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
  const inhalt = d.choices?.[0]?.message?.content || "";
  if (!inhalt.trim()) throw new Error("Die Antwort war leer.");
  return inhalt;
}
