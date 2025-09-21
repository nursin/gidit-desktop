import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect mobile viewport (width < MOBILE_BREAKPOINT).
 * Safe for Electron renderer; guards for non-window environments.
 */
export function useIsMobile(): boolean {
  const getInitial = () =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false;

  const [isMobile, setIsMobile] = useState<boolean>(getInitial);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Modern browsers support addEventListener on MediaQueryList; fallback to addListener.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
    } else if (typeof (mql as any).addListener === "function") {
      (mql as any).addListener(onChange);
    }

    // Ensure state is correct on mount/resume
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", onChange);
      } else if (typeof (mql as any).removeListener === "function") {
        (mql as any).removeListener(onChange);
      }
    };
  }, []);

  return isMobile;
}
