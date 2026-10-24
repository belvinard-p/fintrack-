import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False while the page is rendered on the server and during hydration, true once it runs in the browser.
 *
 * Lets a component wait for the browser (to read the session token or the theme) without calling setState inside an
 * effect, which React flags as a cascading render. Both renders agree with the server HTML, so nothing mismatches.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
