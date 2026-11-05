declare global {
  interface Window {
    __APP_CONFIG__?: {
      /** Base URL of the ClientraPlatform API Gateway (no trailing slash). */
      API_URL?: string;
      /** Optional separate origin for uploaded files / avatars. */
      MEDIA_URL?: string;
      /** Dev only: static X-Organization-Token. */
      ORG_TOKEN?: string;
    };
  }
}

/**
 * Development default: the local ClientraPlatform API Gateway.
 * Production default: "" (same origin), i.e. the gateway is expected behind
 * the same host/reverse proxy. Override at runtime through /config.js
 * (window.__APP_CONFIG__.API_URL) or at build time through NEXT_PUBLIC_API_URL.
 */
export const DEFAULT_API_URL =
  process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8080";

export function getApiUrl(): string {
  const fromWindow =
    typeof window !== "undefined" ? window.__APP_CONFIG__?.API_URL : undefined;

  const value = (
    fromWindow ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_API_URL
  ).trim();

  return value.replace(/\/+$/, "");
}

/**
 * Origin used to build URLs for uploaded files and avatars. Defaults to the
 * API base. <img src> and <a href> cannot send X-Organization-Token, so when
 * the gateway requires it, files must be served from a different origin
 * (signed URLs, CDN or static server) and configured through MEDIA_URL.
 */
export function getMediaUrl(): string {
  const fromWindow =
    typeof window !== "undefined" ? window.__APP_CONFIG__?.MEDIA_URL : undefined;

  const value = (fromWindow || process.env.NEXT_PUBLIC_MEDIA_URL || "").trim();

  return value ? value.replace(/\/+$/, "") : getApiUrl();
}
