import { useEffect, useState, useCallback } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Module-level cache so any component can trigger the prompt
let deferredEvent: BIPEvent | null = null;
const listeners = new Set<(v: BIPEvent | null) => void>();

function setDeferred(e: BIPEvent | null) {
  deferredEvent = e;
  listeners.forEach((l) => l(e));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setDeferred(e as BIPEvent);
  });
  window.addEventListener("appinstalled", () => setDeferred(null));
}

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}
export function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(/CriOS|FxiOS/i.test(navigator.userAgent));
}
export function isInstallSupported() {
  if (typeof window === "undefined") return false;
  if (isStandaloneApp()) return false;
  return true;
}

export const INSTALL_EVENT = "shopitt:install-prompt";

export function requestInstallPrompt() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(INSTALL_EVENT));
}

export function useInstallPrompt() {
  const [deferred, setLocal] = useState<BIPEvent | null>(deferredEvent);
  const [installed, setInstalled] = useState<boolean>(isStandaloneApp());

  useEffect(() => {
    const l = (e: BIPEvent | null) => setLocal(e);
    listeners.add(l);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      listeners.delete(l);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
      return "accepted" as const;
    }
    return "dismissed" as const;
  }, [deferred]);

  return {
    canInstall: !installed,
    hasNativePrompt: !!deferred,
    installed,
    isIOS: isIOSDevice(),
    promptInstall,
  };
}
