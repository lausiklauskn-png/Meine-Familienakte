"use client";
// Schriftgröße „A··A“ (Klaus 11.11.: wie in Workflow PDF): der gemeinsame Baustein der Pro-Apps (public/native/pro-bedienung.js,
// byte-gleich aus Private Brain Pro) baut Knopf und Regler; hier wird er nur in den Kopf gehängt. 85–150 %, je Gerät gemerkt.
import { useEffect, useRef } from "react";

type ProBedienung = { schriftKnopf: () => HTMLElement };

export function SchriftKnopf() {
  const ort = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const pb = (window as unknown as { ProBedienung?: ProBedienung }).ProBedienung;
    const host = ort.current;
    if (!pb || !host || host.childElementCount) return;
    const knopf = pb.schriftKnopf();
    host.append(knopf);
    return () => { knopf.remove(); };
  }, []);
  return <span ref={ort} className="fa-schrift" data-fa-schrift/>;
}
