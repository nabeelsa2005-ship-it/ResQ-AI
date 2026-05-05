import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { hideSplash, tintStatusBar, isNative } from "./utils/native";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Native (Capacitor) bootstrap — runs only inside the Android/iOS wrapper.
if (isNative()) {
  tintStatusBar("dark", "#FFFFFF");
  // Give React a moment to paint before hiding the splash.
  setTimeout(() => { hideSplash(); }, 400);
}

// Register service worker for offline support (production only, web only —
// inside the Capacitor wrapper assets are local and don't need SW caching).
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production" && !isNative()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.warn("SW registration failed:", err));
  });
}
