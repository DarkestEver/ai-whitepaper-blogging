export class RequestValidationError extends Error {}
export class FeatureUnavailableError extends Error {}
export class KillSwitchError extends FeatureUnavailableError {}

/** Check whether a named capability is disabled via its kill switch environment variable. */
export function assertKillSwitchOff(capability: "ai" | "publish" | "ingest"): void {
  const envMap: Record<string, string> = {
    ai: "KILL_AI_GENERATION",
    publish: "KILL_PUBLISHING",
    ingest: "KILL_INGEST",
  };
  const envVar = envMap[capability];
  if (process.env[envVar]?.trim().toLowerCase() === "true") {
    throw new KillSwitchError(`${capability} is temporarily disabled by the ${envVar} kill switch.`);
  }
}

export function isSameOriginPost(request: Pick<Request, "headers">): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function safeErrorResponse(error: unknown): { status: number; message: string } {
  if (error instanceof RequestValidationError) {
    return { status: 400, message: error.message };
  }
  if (error instanceof FeatureUnavailableError) {
    return { status: 503, message: error.message };
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as Record<string, unknown>).code);
    if (code === "11000" || code.startsWith("SQLITE_CONSTRAINT_UNIQUE")) {
      return { status: 409, message: "A record with that identifier already exists." };
    }
  }
  console.error("Admin request failed.", error);
  return { status: 500, message: "The request could not be completed. Check server logs using the request time." };
}
