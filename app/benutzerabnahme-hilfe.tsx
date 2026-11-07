import { ClipboardCheck } from "lucide-react";
import { Ablaufbild, Pfad } from "./ablaufbild";
import { USER_RESULT_LABEL, USER_TEST_BLOCKS, type UserResult } from "../lib/practical-acceptance";

/**
 * Hilfe → „Praktische Benutzerabnahme“ als Bild (Plan 07.11.2026, Punkt 5): Weg, drei Blöcke mit je fünf Fragen in den Farben
 * des gespeicherten Stands (grün Klappt · rot Klappt nicht/Noch nicht probiert · grau Gilt hier nicht), Musterfrage, Grenzen.
 * Nur zum Ansehen; geantwortet wird in der Systemprüfung. Ein Tipp führt dorthin (zur Frage, falls sie gerade sichtbar ist).
 */
const ART: Record<UserResult | "offen", string> = { Ja: "art-gut", Nein: "art-warnung", "Nicht geprüft": "art-warnung", "Gilt hier nicht": "art-aus", offen: "art-warnung" };
const ZEICHEN: Record<UserResult | "offen", string> = { Ja: "✓ ", Nein: "✗ ", "Nicht geprüft": "", "Gilt hier nicht": "⊘ ", offen: "" };

export function BenutzerabnahmeHilfe({ ergebnisse, zurAbnahme }: { ergebnisse: Record<string, UserResult | undefined>; zurAbnahme: (testId?: string) => void }) {
  const stand = (id: string): UserResult | "offen" => ergebnisse[id] || "offen";
  const zaehlen = (ids: string[]) => ({
    klappt: ids.filter((id) => stand(id) === "Ja").length,
    offen: ids.filter((id) => ["Nein", "Nicht geprüft", "offen"].includes(stand(id))).length,
    nicht: ids.filter((id) => stand(id) === "Gilt hier nicht").length,
  });
  const alle = zaehlen(USER_TEST_BLOCKS.flatMap((b) => b.tests.map((t) => t.id)));
  return <details data-benutzerabnahme-hilfe className="wo-liegt-was aktensicherung">
    <summary><ClipboardCheck/> Praktische Benutzerabnahme (für Prüfer)</summary>
    <div>
      <p>Ein Prüfzettel: Du probierst die App aus wie ein neuer Nutzer und hältst je Frage fest, ob es klappt. Er ändert nichts an deinen Daten und gibt die App nicht frei.</p>
      <Pfad teile={[{ text: "Hilfe" }, { text: "Systemprüfung" }, { text: "Praktische Benutzerabnahme", ziel: () => zurAbnahme() }]}/>
      <p className="aktensicherung-legende"><span className="chip-gruen">✓ Klappt</span><span className="chip-rot">Klappt nicht · Noch nicht probiert</span><span className="chip-grau">⊘ Gilt hier nicht</span><span data-abnahme-stand>{alle.klappt} klappt · {alle.offen} offen · {alle.nicht} gilt nicht</span></p>
      <div className="aktensicherung-orte">
        {USER_TEST_BLOCKS.map((b, i) => {
          const z = zaehlen(b.tests.map((t) => t.id));
          return <section key={b.id} className="aktensicherung-ort" data-abnahme-block={b.id}>
            <button type="button" className="ablauf-knoten ablauf-link art-hervor" onClick={() => zurAbnahme()} title={`Block ${i + 1} – in der Systemprüfung öffnen`}>
              <span className="ablauf-text"><strong>Block {i + 1}: {b.title}</strong><small>{z.klappt} klappt · {z.offen} offen{z.nicht ? ` · ${z.nicht} gilt nicht` : ""}</small></span><span className="ablauf-pfeil" aria-hidden="true">›</span></button>
            <ul className="ordnerbaum aktensicherung-baum"><li className="baum-wurzel-leer"><ul>{b.tests.map((t) => {
              const s = stand(t.id);
              return <li key={t.id}><button type="button" className={`ablauf-knoten ablauf-link ${ART[s]}`} data-abnahme-frage={t.id} data-stand={s} onClick={() => zurAbnahme(t.id)}
                title={`${t.title}: ${s === "offen" ? "noch keine Antwort" : USER_RESULT_LABEL[s]} – zur Frage`}>
                <span className="ablauf-text"><strong>{ZEICHEN[s]}{t.number}. {t.title}</strong><small>{s === "offen" ? "noch keine Antwort" : USER_RESULT_LABEL[s]}</small></span></button></li>;
            })}</ul></li></ul>
          </section>;
        })}
      </div>
      <p className="pfad-titel"><strong>Je Frage:</strong></p>
      <Ablaufbild label="Eine Frage beantworten" knoten={[
        { titel: "Anleitung lesen", unter: "steht unter der Frage" },
        { titel: "Ausprobieren", unter: "in der App" },
        { titel: "Antwort wählen", unter: "Klappt · Klappt nicht · Noch nicht probiert · Gilt hier nicht", art: "hervor" },
        { titel: "Bei „Klappt nicht“", unter: "kurz notieren, was falsch war" },
      ]}/>
      <p className="pfad-titel"><strong>Je Block:</strong></p>
      <Ablaufbild label="Einen Block abschließen" knoten={[
        { titel: "Alle 5 beantwortet" },
        { titel: "„Alle 5 Prüfergebnisse übermitteln“", unter: "oder „speichern und unterbrechen“, später weiter", art: "gut" },
      ]}/>
      <ul className="merkpunkte">
        <li>Gespeichert nur auf diesem Gerät.</li>
        <li>„Klappt“ bleibt erledigt; die anderen lassen sich einzeln neu prüfen.</li>
        <li>Gibt die App nicht frei; die technische Systemprüfung bleibt getrennt.</li>
      </ul>
    </div>
  </details>;
}
