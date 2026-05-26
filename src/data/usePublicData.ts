import { useEffect, useState } from "react";

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: Error };

/**
 * Hook minimaliste pour consommer une méthode async du PublicDataProvider.
 *
 * Volontairement simple en Phase 1 : pas de cache, pas de Suspense, pas de
 * de-duplication. Sera remplacé par une lib (TanStack Query ou équivalent)
 * en Phase 2 quand le mode live appellera l'API publique réelle.
 *
 * Le tableau `deps` doit lister les valeurs externes utilisées dans `fetcher`
 * (slug, filtres) pour relancer l'appel quand elles changent.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });
    fetcher()
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", data, error: null });
      })
      .catch((rawError) => {
        if (cancelled) return;
        const error =
          rawError instanceof Error ? rawError : new Error(String(rawError));
        setState({ status: "error", data: null, error });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
