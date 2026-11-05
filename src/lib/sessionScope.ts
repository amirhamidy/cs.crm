type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Register a callback that must drop every piece of identity-bound data
 * (caches, in-flight requests, memoised lookups) whenever the session
 * "scope" changes: login, logout, forced sign-out, org token change, or a
 * different user detected in another tab.
 */
export function onSessionScopeChange(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function resetSessionScope(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* one broken cache must not block the others */
    }
  });
}
