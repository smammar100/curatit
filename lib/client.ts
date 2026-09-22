/** Browser-side fetch wrapper for the Curatit API contract. */

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details: Record<string, unknown> | null = null
  ) {
    super(message);
  }
}

export async function apiRequest<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("network", "You appear to be offline. Check your connection and try again.", 0);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      error?.code ?? "unavailable",
      error?.message ?? "Something went wrong. Try again.",
      response.status,
      error?.details ?? null
    );
  }
  return data as T;
}
