export type RegisterTextState =
  | { state: "missing"; value: null }
  | { state: "valid"; value: Record<string, unknown> }
  | { state: "corrupted"; value: null; reason: string };

export function classifyRegisterText(contents: string | null): RegisterTextState {
  if (contents === null) return { state: "missing", value: null };
  try {
    const parsed = JSON.parse(contents) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { state: "corrupted", value: null, reason: "Registerwurzel ist ungültig." };
    return { state: "valid", value: parsed as Record<string, unknown> };
  } catch (error) {
    return { state: "corrupted", value: null, reason: error instanceof Error ? error.message : "Ungültiges JSON" };
  }
}

export function safeRegisterWritePlan(existingContents: string | null, nextContents: string) {
  const existing = classifyRegisterText(existingContents);
  const next = classifyRegisterText(nextContents);
  if (existing.state === "corrupted") return { allowed: false as const, reason: "Beschädigtes vorhandenes Register darf nicht überschrieben werden.", existing, next };
  if (next.state !== "valid") return { allowed: false as const, reason: "Ungültiges neues Register darf nicht geschrieben werden.", existing, next };
  return { allowed: true as const, reason: "Sicherung und temporäres Schreiben zulässig.", existing, next };
}
