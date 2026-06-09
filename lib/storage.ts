import { buildInitialState } from "./seed";
import type { PortalState } from "./types";

const STORAGE_KEY = "kmg.onboarding.portal/v1";

export function loadState(): PortalState {
  if (typeof window === "undefined") {
    return buildInitialState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialState();
      saveState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as PortalState;
    return { ...parsed, hydrated: true };
  } catch (err) {
    console.warn("[storage] failed to parse, regenerating", err);
    const initial = buildInitialState();
    saveState(initial);
    return initial;
  }
}

export function saveState(state: PortalState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[storage] save failed", err);
  }
}

export function resetState(): PortalState {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return buildInitialState();
}

export const STORAGE_KEY_NAME = STORAGE_KEY;
