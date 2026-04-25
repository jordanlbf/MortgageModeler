/**
 * API client for the MortgageModeler platform service (NestJS).
 *
 * Sibling to `lib/api.ts`, which talks to the compute service (FastAPI).
 * Auth requests must travel with credentials so the browser carries the
 * httpOnly refresh cookie issued by the platform.
 *
 * Public auth functions own the token-store writes — callers (AuthContext,
 * forms) read user state via `getMe()` and never poke the token directly.
 */

import {
  getAccessToken,
  setAccessToken,
} from "@/lib/auth-token";

const PLATFORM_BASE =
  process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3001";

export class UnauthenticatedError extends Error {
  constructor(message = "Unauthenticated") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export interface MeResponse {
  userId: string;
  email: string;
}

interface TokenResponse {
  accessToken: string;
  tokenType: string;
}

interface RegisterResponse {
  id: string;
  email: string;
  createdAt: string;
}

// ── Single-flight refresh ───────────────────

let inFlightRefresh: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const res = await fetch(`${PLATFORM_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      throw new UnauthenticatedError("Refresh failed");
    }
    const body = (await res.json()) as TokenResponse;
    setAccessToken(body.accessToken);
    return body.accessToken;
  })();

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

// ── Authed fetch with 401 retry ─────────────

interface PlatformFetchInit extends Omit<RequestInit, "credentials"> {
  /** Skip the bearer + refresh dance. Used by /auth/login and /auth/refresh. */
  skipAuth?: boolean;
}

async function platformFetch(
  path: string,
  init: PlatformFetchInit = {},
): Promise<Response> {
  const { skipAuth, headers: initHeaders, ...rest } = init;

  const send = async (token: string | null): Promise<Response> => {
    const headers = new Headers(initHeaders);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${PLATFORM_BASE}${path}`, {
      ...rest,
      headers,
      credentials: "include",
    });
  };

  if (skipAuth) {
    return send(null);
  }

  let res = await send(getAccessToken());
  if (res.status !== 401) return res;

  let newToken: string;
  try {
    newToken = await refreshAccessToken();
  } catch {
    setAccessToken(null);
    throw new UnauthenticatedError();
  }

  res = await send(newToken);
  if (res.status === 401) {
    setAccessToken(null);
    throw new UnauthenticatedError();
  }
  return res;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    if (body.message) return body.message;
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`;
}

// ── Public auth API ─────────────────────────

export async function login(email: string, password: string): Promise<void> {
  const res = await platformFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as TokenResponse;
  setAccessToken(body.accessToken);
}

export async function register(
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const res = await platformFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as RegisterResponse;
}

export async function logout(): Promise<void> {
  try {
    await platformFetch("/auth/logout", {
      method: "POST",
      skipAuth: true,
    });
  } finally {
    setAccessToken(null);
  }
}

export async function getMe(): Promise<MeResponse> {
  const res = await platformFetch("/auth/me");
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as MeResponse;
}

/**
 * Try to restore a session using the refresh cookie. Returns the user if a
 * valid cookie exists, otherwise null. Used by AuthContext on mount.
 */
export async function bootstrapSession(): Promise<MeResponse | null> {
  try {
    await refreshAccessToken();
  } catch {
    return null;
  }
  try {
    return await getMe();
  } catch {
    setAccessToken(null);
    return null;
  }
}
