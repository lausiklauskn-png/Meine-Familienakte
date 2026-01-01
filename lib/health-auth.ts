export type HealthUser = {
  id: string;
  email: string | null;
};

export function requireHealthUser(request: Request): HealthUser {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id) {
    throw new Response("Anmeldung erforderlich", { status: 401 });
  }
  return {
    id,
    email: request.headers.get("oai-authenticated-user-email"),
  };
}

export function jsonError(error: unknown) {
  if (error instanceof Response) return error;
  console.error(error);
  return Response.json(
    { error: "Die Anfrage konnte gerade nicht verarbeitet werden." },
    { status: 500 },
  );
}
