/**
 *  src/context/UIContextValue.js
 *
 * Exports only the raw React context object.
 * Kept separate from UIContext.jsx and useUI.js so neither file
 * triggers react-refresh/only-export-components.
 */

import { createContext } from "react";
export const UIContext = createContext(null);