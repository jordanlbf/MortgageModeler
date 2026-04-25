/**
 * Access-token store for the platform API.
 *
 * Client-only module: the access token lives in module-scoped memory so it
 * survives navigation but is wiped on full reload. The refresh token is held
 * in an httpOnly cookie by the platform and is invisible to JS.
 *
 * Do not import this module from server components or route handlers — module
 * state would leak between requests on the server.
 */

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  if (accessToken === token) return;
  accessToken = token;
  listeners.forEach((fn) => fn(token));
}

export function subscribeAccessToken(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
