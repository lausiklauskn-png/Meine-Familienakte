import type { InputHTMLAttributes, MouseEvent } from "react";

/**
 * Datumsfeld, das beim Antippen sofort das ganze Datumsfenster öffnet (Klaus 2026-11-05: „niemand soll ein Datum von Hand
 * tippen müssen“). Chrome, Android-WebView und Windows-WebView2 bringen im Fenster die Monats- und Jahreswahl mit, auch
 * rückwärts. Kann der Browser das Fenster nicht öffnen (kein `showPicker`, verweigert), bleibt das Feld wie bisher tippbar.
 */
export function oeffneDatumsfenster(feld: HTMLInputElement) {
  if (feld.disabled || feld.readOnly) return false;
  const zeigen = (feld as HTMLInputElement & { showPicker?: () => void }).showPicker;
  if (typeof zeigen !== "function") return false;
  try { zeigen.call(feld); return true; } catch { return false; }
}

type DatumFeldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { art?: "date" | "time" };

export function DatumFeld({ art = "date", onClick, ...rest }: DatumFeldProps) {
  return <input {...rest} type={art} data-datumsfenster="" onClick={(event: MouseEvent<HTMLInputElement>) => { onClick?.(event); if (!event.defaultPrevented) oeffneDatumsfenster(event.currentTarget); }}/>;
}
