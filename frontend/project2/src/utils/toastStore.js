/**
 * src/utils/toastStore.js
 *
 * Imperative toast bus — zero React, zero components.
 * Kept in a separate file from Toaster.jsx so neither file
 * violates react-refresh/only-export-components.
 *
 * Usage:
 *   import { toast }         from "../utils/toastStore";  // fire a toast
 *   import { registerToast } from "../utils/toastStore";  // used by Toaster
 */

let _handler = null;

/**
 * Called by Toaster.jsx once on mount (inside useEffect).
 * Pass null on unmount to avoid stale closure calls.
 */
export function registerToast(fn) {
  _handler = fn;
}

/**
 * Fire a toast from anywhere — components, hooks, utility functions.
 * @param {string} msg
 * @param {"success"|"error"|"info"|"warning"} [type]
 */
export function toast(msg, type = "success") {
  if (_handler) {
    _handler({ msg, type, id: Date.now() + Math.random() });
  }
}
