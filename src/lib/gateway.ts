import { resetSessionScope } from "@/lib/sessionScope";

/**
 * ClientraPlatform API Gateway, layer 1: every request must carry
 * X-Organization-Token so the gateway can route it to the right tenant and
 * backend version. Layer 2 (Authorization: Bearer ...) is handled by the
 * axios instances.
 *
 * When no org token is configured nothing is attached, so the app keeps
 * working against a plain backend.
 */
export const ORG_TOKEN_HEADER = "X-Organization-Token";

const ORG_TOKEN_KEY = "crm-org-token";

export interface OrgTokenProvider {
  /** Must resolve with a fresh org token, or null when it cannot get one. */
  fetchToken(): Promise<string | null>;
}

let provider: OrgTokenProvider | null = null;
let memoryToken: string | null = null;
let pending: Promise<string | null> | null = null;

function readStored(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(ORG_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: string | null) {
  if (typeof window === "undefined") return;

  try {
    if (value === null) window.localStorage.removeItem(ORG_TOKEN_KEY);
    else window.localStorage.setItem(ORG_TOKEN_KEY, value);
  } catch {
    /* storage may be unavailable */
  }
}

/**
 * Precedence: in-memory > localStorage > /config.js (window.__APP_CONFIG__.ORG_TOKEN)
 * > NEXT_PUBLIC_ORG_TOKEN. The last two are meant for development only.
 */
export function getOrgToken(): string | null {
  if (memoryToken) return memoryToken;

  const fromWindow =
    typeof window !== "undefined" ? window.__APP_CONFIG__?.ORG_TOKEN : undefined;

  const value = (
    readStored() ||
    fromWindow ||
    process.env.NEXT_PUBLIC_ORG_TOKEN ||
    ""
  ).trim();

  return value || null;
}

export function setOrgToken(token: string) {
  const value = token.trim();

  if (!value || value === getOrgToken()) return;

  memoryToken = value;
  writeStored(value);
  resetSessionScope();
}

export function clearOrgToken() {
  const had = Boolean(getOrgToken());

  memoryToken = null;
  writeStored(null);

  if (had) resetSessionScope();
}

/**
 * The contract of the Control Plane token endpoint is owned by the backend
 * team. Plug the real implementation in here once it is confirmed (see
 * docs/gateway-a/OPEN_QUESTIONS.md).
 */
export function registerOrgTokenProvider(next: OrgTokenProvider | null) {
  provider = next;
}

export async function ensureOrgToken(): Promise<string | null> {
  const existing = getOrgToken();

  if (existing) return existing;
  if (!provider) return null;

  if (!pending) {
    pending = provider
      .fetchToken()
      .then((token) => {
        if (token) setOrgToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}

/** Mutates an axios headers object (or any header bag) in place. */
export async function attachOrgToken(headers: { [key: string]: unknown }) {
  const token = await ensureOrgToken();

  if (token) headers[ORG_TOKEN_HEADER] = token;
}

/** For bare axios calls that take a plain headers object. */
export async function gatewayHeaders(): Promise<Record<string, string>> {
  const token = await ensureOrgToken();

  return token ? { [ORG_TOKEN_HEADER]: token } : {};
}
