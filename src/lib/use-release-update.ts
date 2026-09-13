"use client";

import { useEffect } from "react";

export function useReleaseUpdate() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const publicOrigin = new URL(
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
    ).origin;
    if (window.location.origin !== publicOrigin) {
      window.location.replace(publicOrigin);
      return;
    }

    let disposed = false;
    let checking = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    async function checkRelease() {
      if (disposed || checking || document.hidden) return;
      clearTimeout(timer);
      checking = true;
      controller = new AbortController();
      try {
        const response = await fetch(`${publicOrigin}/api/release`, {
          cache: "no-store",
          credentials: "omit",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        });
        if (!response.ok || disposed) return;
        const release: unknown = await response.json();
        if (disposed) return;
        if (
          !release ||
          typeof release !== "object" ||
          !("version" in release) ||
          typeof release.version !== "string" ||
          !release.version
        )
          return;
        if (release.version !== process.env.NEXT_PUBLIC_BUILD_ID) {
          const current = new URL(window.location.href);
          // Try each release once even if a proxy temporarily serves an old document.
          if (current.searchParams.get("_gosw_release") !== release.version) {
            const latest = new URL("/", publicOrigin);
            latest.searchParams.set("_gosw_release", release.version);
            window.location.replace(latest.href);
          }
        }
      } catch {
        // A release check must not interrupt score updates during network loss.
      } finally {
        checking = false;
        if (!disposed) timer = setTimeout(checkRelease, 30000);
      }
    }
    const refresh = () => {
      if (!document.hidden) void checkRelease();
    };
    void checkRelease();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);
}
