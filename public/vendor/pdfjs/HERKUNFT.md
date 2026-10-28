# pdf.js 3.11.174 (Apache-2.0)

Byte-gleich aus dem npm-Paket `pdfjs-dist@3.11.174` (`build/pdf.min.js`, `build/pdf.worker.min.js`, `LICENSE`).
Vorher lud `app/file-viewer.tsx` dieselbe Fassung von cdnjs; seit dem Umbau zur offline-fähigen App
(2026-10-28) liegt sie im Paket, damit die PDF-Vorschau ohne Netz und bei ausgeschaltetem Internetschalter geht.
Nie hier abwandeln; bei einem Wechsel der Fassung `PDFJS_VERSION` in `app/file-viewer.tsx` mitziehen.
