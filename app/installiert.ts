/**
 * Knopf „Installieren“ nur, solange die Web-App noch nicht installiert ist (Klaus 08.11.2026).
 * Läuft die Seite selbst als installierte App, blendet ihn schon der gepinnte Baustein public/native/installieren.js aus.
 * Hier der zweite Fall: die Seite ist im Browser offen, die Web-App ist auf diesem Gerät aber schon installiert. Chrome
 * (Android, Windows) meldet das über getInstalledRelatedApps; dafür nennt das Manifest sich selbst unter
 * related_applications. Andere Browser kennen die Abfrage nicht – dort bleibt alles wie bisher. Ob die APK installiert
 * ist, kann eine Webseite nicht erfahren.
 */
type Verwandt = { platform: string };
export async function installierteWebAppErkennen(): Promise<boolean> {
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<Verwandt[]> };
  if (typeof nav.getInstalledRelatedApps !== "function") return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    const da = apps.some((a) => a.platform === "webapp");
    document.documentElement.classList.toggle("pwa-installiert", da);
    return da;
  } catch { return false; }
}
