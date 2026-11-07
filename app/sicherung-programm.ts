/** P5, Frage s: Programm zur Vollsicherung, getrennt von den Daten. Android legt die eigene APK in den Sicherungsordner,
 *  Windows einen Lies-mich mit Download-Adresse und SHA-256 des Setups. Im Browser nichts (die Web-App braucht keine Installation). */
import { istNativerOrdner, liesMichWindows, nativePlattform } from "./nativer-ordner";

export async function programmBeilegen(ziel: FileSystemDirectoryHandle, sicherungsordner: string, fassung: string): Promise<string> {
  if (!istNativerOrdner(ziel)) return "";
  const ordner = await ziel.getDirectoryHandle(sicherungsordner);
  if (nativePlattform() === "android" && istNativerOrdner(ordner)) {
    const r = await ordner.programmBeilegen();
    return r ? ` Die Installationsdatei „${r.name}“ (SHA-256 ${r.sha256.slice(0, 12)}…) liegt daneben.` : "";
  }
  if (nativePlattform() === "windows") {
    const datei = await ordner.getFileHandle("Programm_Lies-mich.txt", { create: true });
    const w = await datei.createWritable(); await w.write(await liesMichWindows(fassung)); await w.close();
    return " Ein Lies-mich mit Download-Adresse und SHA-256 des Windows-Setups liegt daneben.";
  }
  return "";
}
