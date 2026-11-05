// Öffentliche Kennungen der Kalender-Konten (Klaus 2026-11-05). Client-IDs sind nicht geheim und dürfen ins Repo; Geheimnisse,
// Zugänge und Erneuerungsschlüssel nie. Leer = „noch nicht eingerichtet“: der Anbieter zeigt das statt eines toten Knopfs.
// Einrichtung Schritt für Schritt: docs/KALENDER-EINRICHTUNG.md.
export const KALENDER_KONTEN = {
  google: {
    /** Google Cloud → APIs & Dienste → Anmeldedaten → OAuth-Client „Webanwendung“ (Browser/PWA). */
    webClientId: "",
    /** OAuth-Client „Desktop-App“ (Windows); sein Client-Geheimnis nur als GitHub-Secret FA_GOOGLE_DESKTOP_SECRET. */
    desktopClientId: "",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  },
  microsoft: {
    /** Entra → App-Registrierungen → Anwendungs-ID (Client-ID); gilt für Browser (SPA) und Windows (localhost). */
    clientId: "",
    scope: "openid profile offline_access https://graph.microsoft.com/Calendars.ReadWrite",
  },
} as const;
