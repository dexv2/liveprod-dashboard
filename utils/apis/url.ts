import { SOURCE_URL } from "./source";

// Central helper to produce absolute API URLs for server-side fetches.
// Preference order for base URL:
// 1) SOURCE_URL (project-specific), 2) NEXTAUTH_URL, 3) localhost with PORT.
export const getBaseUrl = () => {
  return SOURCE_URL || process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`;
}

export const getApiUrl = (path: string) => {
  // Ensure path starts with a forward slash
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return new URL(safePath, getBaseUrl()).toString();
}

export default getApiUrl;

// Helper to try multiple base URLs (development convenience) and return the
// first successful Response. In development we try common localhost ports
// to match the dev server port if SOURCE_URL points elsewhere.
export async function fetchApi(path: string, init?: RequestInit) {
  const safePath = path.startsWith("/") ? path : `/${path}`;

  const triedBases: string[] = [];

  // Candidate bases order: in development try localhost ports first, then
  // configured SOURCE_URL/NEXTAUTH_URL; in production just use configured URL.
  const candidates: string[] = [];
  if (process.env.NODE_ENV === 'development') {
    // Try a range of likely dev ports (3000-3010). This covers Next choosing
    // an alternate port when 3000 is in use.
    for (let p = 3000; p <= 3010; p++) candidates.push(`http://localhost:${p}`);
  }

  if (getBaseUrl()) candidates.push(getBaseUrl());
  if (process.env.NEXTAUTH_URL) candidates.push(process.env.NEXTAUTH_URL);

  let lastErr: any = null;
  let lastNonOkResponse: Response | null = null;

  for (const base of candidates) {
    if (!base) continue;
    triedBases.push(base);
    try {
      const url = new URL(safePath, base).toString();
      const res = await fetch(url, init as any);
      // If we got a successful 2xx response return it immediately
      if (res.ok) return res;
      // Keep the last non-ok response in case none succeed
      lastNonOkResponse = res;
    } catch (err) {
      lastErr = err;
      // try next candidate
      continue;
    }
  }

  if (lastNonOkResponse) return lastNonOkResponse;
  throw lastErr || new Error(`Failed to fetch API ${safePath} (tried: ${triedBases.join(',')})`);
}
