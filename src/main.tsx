import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";
import "./index.css";

const STALE_ASSET_RELOAD_KEY = "shopitt:stale-asset-reload";
const staleAssetPattern = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Failed to load module script/i;

const recoverFromStaleAsset = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  if (!staleAssetPattern.test(message) || sessionStorage.getItem(STALE_ASSET_RELOAD_KEY)) return;
  sessionStorage.setItem(STALE_ASSET_RELOAD_KEY, "1");
  window.location.reload();
};

window.addEventListener("unhandledrejection", (event) => recoverFromStaleAsset(event.reason));
window.addEventListener("error", (event) => recoverFromStaleAsset(event.error ?? event.message), true);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    let controllerReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (controllerReloaded) return;
      controllerReloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch((error) => console.warn("Shopitt service worker registration failed", error));
  });
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
