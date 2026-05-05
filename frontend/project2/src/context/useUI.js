/**
 * src/context/useUI.js
 *
 * Exports only the useUI hook.
 * Kept separate from UIContext.jsx so react-refresh sees a file
 * that exports only non-component logic — this is allowed.
 * (react-refresh only flags files that MIX components and non-components.)
 */

// src/context/useUI.js
import { useContext } from "react";
import { UIContext } from "./UIContextValue";

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}