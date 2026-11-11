// Dateiort einer Unterlage (2.28.61): reine Rechnung, ohne DOM. Siehe app/datei-ort.tsx.
const istProOriginal = (pfad: string) => pfad.startsWith("pro-tresor:");
const istWindowsPfad = (p: string) => /^[A-Za-z]:\\/.test(p);

export type DateiOrtAngabe = { anzeige: string; kopie: string; explorer: string | null };
/** Aus gespeichertem Pfad, Akten-Ordner und Tresor-Ort: Anzeige, Text zum Kopieren und (nur bei einem Windows-Pfad) der Ordner für den Explorer. */
export function dateiOrtAngabe(storedPath: string, akte: string, tresorOrt: string | null, ohneDateiname = false): DateiOrtAngabe {
  if (istProOriginal(storedPath)) {
    const ort = (tresorOrt || "").replace(/^content:\/\/[^/]+\/(tree\/)?/, "");
    // Android meldet „SD/USB (3039-3234)/Ordner“ – der Speichername bleibt ein Teil.
    const sd = ort.match(/^(SD\/USB \([^)]*\))\/?(.*)$/);
    const teile = !ort ? ["Pro-Tresor"] : (sd ? [sd[1], ...sd[2].split(/[\\/]+/)] : ort.split(/[\\/]+/)).filter(Boolean);
    return { anzeige: `${teile.join(" › ")} › Tresorordner (verschlüsselt)`, kopie: ort || "Pro-Tresor", explorer: tresorOrt && istWindowsPfad(tresorOrt) ? tresorOrt : null };
  }
  const teile = storedPath.split("/").filter(Boolean);
  if (ohneDateiname) teile.pop();
  const wurzel = akte || "Speicher der App";
  return { anzeige: [wurzel, ...teile].join(" › "), kopie: [akte, ...teile].filter(Boolean).join("/"), explorer: null };
}
