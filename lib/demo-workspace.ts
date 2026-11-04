/** Eigener lokaler Arbeitsbereich; die Echt-Schlüssel bleiben bytegleich. */
export const demoActive = () => typeof location !== "undefined" && new URLSearchParams(location.search).get("demo") === "1";
export const workspaceName = (name: string) => demoActive() ? `Familienakte-Demo-v1:${name}` : name;
export const workspaceStorage = {
  getItem: (key: string) => localStorage.getItem(workspaceName(key)),
  setItem: (key: string, value: string) => localStorage.setItem(workspaceName(key), value),
  removeItem: (key: string) => localStorage.removeItem(workspaceName(key)),
};
export function switchDemo(active: boolean) {
  const url = new URL(location.href);
  if (active) url.searchParams.set("demo", "1"); else url.searchParams.delete("demo");
  url.hash = "";
  location.assign(url.href);
}

/** Auf einer frischen Seite vor React ausführen, damit keine Demo-Datenbank offen ist. */
export async function resetDemoStorage() {
  const prefix = "Familienakte-Demo-v1:";
  if (typeof navigator.storage?.getDirectory === "function") {
    const root = await navigator.storage.getDirectory();
    try { await root.removeEntry(`${prefix}Browser-Datentresor`, { recursive: true }); }
    catch (error) { if (!(error instanceof DOMException) || error.name !== "NotFoundError") throw error; }
  }
  for (const name of ["mmi-local-vault", "mmi-browser-dateien", "FamilienakteStapel1", "FamilienakteBedeutung1"]) {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(prefix + name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Bitte andere geöffnete Demo-Fenster schließen und erneut zurücksetzen."));
    });
  }
  for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
  for (const key of Object.keys(sessionStorage)) if (key.startsWith(prefix)) sessionStorage.removeItem(key);
}
