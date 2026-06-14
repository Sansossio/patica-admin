"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

/**
 * URL/history-driven state for the two stacked Activity modals.
 *
 * The open state is derived straight from the query string (`?day=...` for the
 * level-2 day modal, `&user=...` for the stacked level-3 user modal), so the
 * browser Back button (and edge swipe-back) closes the topmost modal instead of
 * leaving /activity. Forward re-opens it. No manual `popstate` listener is
 * needed: Next 14.1+ patches `window.history.pushState/replaceState` so that
 * `useSearchParams()` re-renders on both our own pushes AND on Back/Forward —
 * WITHOUT a server/RSC round-trip (which `router.push` would trigger, defeating
 * the preloaded window).
 *
 * Two things this hook is careful about:
 *  1. It mutates ONLY the `day`/`user` params and preserves everything else
 *     (notably the weekly `page` param) by rebuilding the URL from the live
 *     `window.location.search`. Replacing the whole query string would drop the
 *     selected week and make the in-modal RefreshButton reload week 0.
 *  2. Deep-link / refresh: when the user lands directly on `?day=...` there is no
 *     prior entry of ours to pop, so `history.back()` would leave the site. We
 *     tag every entry WE push with a flag in (per-entry) `history.state`; that
 *     flag travels with Back/Forward, so — unlike a React ref counter — it never
 *     desyncs when a modal is closed via the browser Back button. `closeTop()`
 *     pops with `history.back()` only when the current entry carries our flag,
 *     otherwise it `replaceState`s down to the parent URL (keeping `page` etc.).
 */
const PUSHED_FLAG = "activityModalPushed";

function currentParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

// Build a `<path>?a=b` string (or the bare path when no params remain) so every
// untouched key — above all the weekly `page` — survives the mutation.
function urlFrom(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
}

// Pass a CLEAN state object — do NOT spread window.history.state. Next's patched
// history.pushState/replaceState BAIL OUT (skipping the dispatch that re-renders
// useSearchParams) when the passed state carries Next's internal __NA flag. By
// passing only our own key, Next re-merges its internals (__NA + router tree)
// onto the stored entry itself, so the URL update propagates client-side AND our
// flag persists on the entry (and travels with Back/Forward).
function pushedState(): Record<string, unknown> {
  return { [PUSHED_FLAG]: true };
}

export function useActivityModalUrl() {
  const searchParams = useSearchParams();
  const openDay = searchParams.get("day");
  const openUser = searchParams.get("user");

  const openDayModal = useCallback((day: string) => {
    const params = currentParams(); // keep page (and anything else)
    params.set("day", day);
    params.delete("user");
    window.history.pushState(pushedState(), "", urlFrom(params));
  }, []);

  const openUserModal = useCallback((day: string, userId: string) => {
    const params = currentParams();
    params.set("day", day);
    params.set("user", userId);
    window.history.pushState(pushedState(), "", urlFrom(params));
  }, []);

  /**
   * Close the topmost modal. Pops exactly one entry (identical to the browser
   * Back button) when we own the current entry; otherwise rewrites the URL to
   * its parent so a deep-link/refresh close never leaves the site or loses the
   * selected week.
   */
  const closeTop = useCallback(() => {
    const state = window.history.state as Record<string, unknown> | null;
    if (state && state[PUSHED_FLAG]) {
      window.history.back();
      return;
    }
    const params = currentParams();
    if (params.has("user")) params.delete("user");
    else params.delete("day");
    // Clean state (not the current __NA-bearing state) so Next's patched
    // replaceState actually re-renders useSearchParams; it re-merges internals.
    window.history.replaceState({}, "", urlFrom(params));
  }, []);

  return { openDay, openUser, openDayModal, openUserModal, closeTop };
}
