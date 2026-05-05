/**
 * src/context/UIContext.jsx
 *
 * FIX: react-refresh/only-export-components
 *   This file exports ONLY the UIProvider component.
 *   useUI hook lives in src/context/useUI.js (separate file).
 *   UIContext object lives in src/context/UIContextValue.js (separate file).
 *
 * Import pattern for consumers:
 *   import { UIProvider } from "./context/UIContext";
 *   import { useUI }      from "./context/useUI";
 */
// src/context/UIContext.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import { UIContext } from "./UIContextValue";

export function UIProvider({ children }) {
  const [overlayOpen,   setOverlayOpen]   = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [cursorVariant, setCursorVariant] = useState("default");
  const lockRef  = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const acquireLock = useCallback(() => {
    if (lockRef.current) return false;
    lockRef.current = true;
    setTransitioning(true);
    return true;
  }, []);

  const releaseLock = useCallback((delay = 0) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lockRef.current = false;
      setTransitioning(false);
    }, delay);
  }, []);

  const isLocked = useCallback(() => lockRef.current, []);

  return (
    <UIContext.Provider value={{
      overlayOpen, setOverlayOpen,
      transitioning, cursorVariant, setCursorVariant,
      acquireLock, releaseLock, isLocked,
    }}>
      {children}
    </UIContext.Provider>
  );
}
