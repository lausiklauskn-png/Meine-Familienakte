import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Me, Myself and I – Meine Familienakte",
  description:
    "Privater Aktenschrank für Gesundheit, Arbeit, Familie, Wohnen, Fahrzeuge, Käufe, Garantien und wichtige Unterlagen.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
