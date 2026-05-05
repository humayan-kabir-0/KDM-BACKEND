// useTransitionLock.js
import { useUI } from "../context/UIContext";

export function useTransitionLock() {
  const { acquireLock, releaseLock, transitioning, isLocked } = useUI();
  return { acquireLock, releaseLock, transitioning, isLocked };
}
