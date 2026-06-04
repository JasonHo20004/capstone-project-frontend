import { useEffect } from "react";

/**
 * Warn the user before leaving / refreshing the page while `enabled` is true.
 * Use during in-progress tests or unsaved forms so a stray refresh / tab close
 * doesn't silently discard work.
 *
 * Note: browsers ignore the custom message and show their own generic prompt,
 * but `message` is still set for the few engines that honour it.
 */
export function useBeforeUnload(enabled: boolean, message?: string) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message ?? "";
      return message ?? "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, message]);
}

export default useBeforeUnload;
