/**
 * src/components/Toaster.jsx
 *
 * FIX: registerToast() was being called at the top level of the render
 * function on every render cycle — this is a side effect and must live
 * in useEffect. Moved to useEffect with proper cleanup.
 *
 * Exports only the Toaster component → no react-refresh violation.
 */
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { registerToast } from "../utils/toastStore";

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev.slice(-2), t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  // ✅ FIX: register inside useEffect — not during render
  useEffect(() => {
    registerToast(addToast);
    return () => registerToast(null); // cleanup on unmount
  }, [addToast]);

  const COLOR = {
    success: "bg-emerald-500/90",
    error: "bg-red-500/90",
    info: "bg-blue-500/90",
    warning: "bg-amber-500/90",
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`${COLOR[t.type] ?? COLOR.success} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm pointer-events-auto min-w-[220px] max-w-xs`}
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
