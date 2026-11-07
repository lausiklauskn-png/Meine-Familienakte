/** Native save dialogs use existing output tickets / the bundled Java engine.
 * A browser download only means its download was started, never destination receipt. */
/** Klaus 07.11. (Frage b): 100 MB. Android und Windows schreiben stückweise; der alte Windows-Weg in einem Stück bleibt bis 20 MB. */
export const MAX_AUSGABE_BYTES = 100 * 1024 * 1024 + 8192 + 12;
const EIN_STUECK_BYTES = 20 * 1024 * 1024 + 8192 + 12;
type Result = { saved?: boolean; cancelled?: boolean };
type FilesPlugin = {
  begin(a: { name: string; mime: string }): Promise<{ id: string }>;
  append(a: { id: string; offset: number; data: string }): Promise<{ size: number }>;
  finish(a: { id: string; size: number }): Promise<{ size: number }>;
  save(a: { id: string }): Promise<Result>;
  abort(a: { id: string }): Promise<unknown>;
};
type OutputWindow = Window & { Capacitor?: {
  isNativePlatform?: () => boolean; getPlatform?: () => string;
  Plugins?: { WorkflowFiles?: FilesPlugin; FamilyOutput?: { save(a: { name: string; data: string; sha256: string }): Promise<Result> }; FamilyFolders?: OrdnerAusgabe };
} };
type OrdnerAusgabe = {
  ausgabeBeginn(a: { name: string }): Promise<{ id: string }>;
  ausgabeAnhaengen(a: { id: string; offset: number; data: string }): Promise<{ size: number }>;
  ausgabeFertig(a: { id: string; size: number }): Promise<{ size: number }>;
  ausgabeSpeichern(a: { id: string }): Promise<Result>;
  ausgabeVerwerfen(a: { id: string }): Promise<unknown>;
};
const base64 = (bytes: Uint8Array) => {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
};
export async function dateiAusgeben(file: File): Promise<"gespeichert" | "abgebrochen" | "download-gestartet"> {
  if (file.size > MAX_AUSGABE_BYTES || !file.name || file.name.length > 200 || /[\u0000-\u001f/\\:]/.test(file.name)) throw Error("Die Ausgabedatei ist zu groß oder hat einen unzulässigen Namen.");
  const cap = (window as OutputWindow).Capacitor;
  if (cap?.isNativePlatform?.()) {
    if (cap.getPlatform?.() === "android" && cap.Plugins?.WorkflowFiles) {
      const plugin = cap.Plugins.WorkflowFiles, { id } = await plugin.begin({ name: file.name, mime: file.type });
      try {
        for (let offset = 0; offset < file.size; offset += 262144) {
          const bytes = new Uint8Array(await file.slice(offset, offset + 262144).arrayBuffer());
          const result = await plugin.append({ id, offset, data: base64(bytes) });
          if (result.size !== offset + bytes.length) throw Error("Die Dateiausgabe ist unvollständig.");
        }
        const complete = await plugin.finish({ id, size: file.size });
        if (complete.size !== file.size) throw Error("Die Dateiausgabe ist unvollständig.");
        const result = await plugin.save({ id });
        if (result.cancelled) return "abgebrochen";
        if (!result.saved) throw Error("Die Datei wurde nicht bestätigt gespeichert.");
        return "gespeichert";
      } finally { await plugin.abort({ id }).catch(() => { /* Process start clears interrupted tickets. */ }); }
    }
    if (cap.getPlatform?.() === "windows" && cap.Plugins?.FamilyFolders?.ausgabeBeginn) {
      const plugin = cap.Plugins.FamilyFolders, { id } = await plugin.ausgabeBeginn({ name: file.name });
      try {
        for (let offset = 0; offset < file.size; offset += 1048576) {
          const bytes = new Uint8Array(await file.slice(offset, offset + 1048576).arrayBuffer());
          const result = await plugin.ausgabeAnhaengen({ id, offset, data: base64(bytes) });
          if (result.size !== offset + bytes.length) throw Error("Die Dateiausgabe ist unvollständig.");
        }
        if ((await plugin.ausgabeFertig({ id, size: file.size })).size !== file.size) throw Error("Die Dateiausgabe ist unvollständig.");
        const result = await plugin.ausgabeSpeichern({ id });
        if (result.cancelled) return "abgebrochen";
        if (!result.saved) throw Error("Die Datei wurde nicht bestätigt gespeichert.");
        return "gespeichert";
      } finally { await plugin.ausgabeVerwerfen({ id }).catch(() => { /* Ende der Engine räumt auf. */ }); }
    }
    if (cap.getPlatform?.() === "windows" && cap.Plugins?.FamilyOutput) {
      if (file.size > EIN_STUECK_BYTES) throw Error("Dateien über 20 MB braucht die aktuelle Windows-App.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(x => x.toString(16).padStart(2, "0")).join("");
      const result = await cap.Plugins.FamilyOutput.save({ name: file.name, data: base64(bytes), sha256: hash });
      if (result.cancelled) return "abgebrochen";
      if (!result.saved) throw Error("Die Datei wurde nicht bestätigt gespeichert.");
      return "gespeichert";
    }
    throw Error("Bitte die aktuelle Android- oder Windows-App für die Dateiausgabe verwenden.");
  }
  const url = URL.createObjectURL(file), link = document.createElement("a");
  link.href = url; link.download = file.name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return "download-gestartet";
}
