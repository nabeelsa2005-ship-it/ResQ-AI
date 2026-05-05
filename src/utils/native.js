// Thin abstraction over Capacitor native APIs.
// On web, falls back to browser equivalents so the same code runs everywhere.
//
// We dynamically import @capacitor/* so the web build tree-shakes correctly
// and the native plugins only execute when running inside the Android wrapper.

import { Capacitor } from "@capacitor/core";

const isNative = () => Capacitor.isNativePlatform();

// ── Haptics ────────────────────────────────────────────────────────────────
export const hapticTick = async () => {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    } catch {}
  }
  if (navigator.vibrate) navigator.vibrate(40);
};

export const hapticSuccess = async () => {
  if (isNative()) {
    try {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      await Haptics.notification({ type: NotificationType.Success });
      return;
    } catch {}
  }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
};

export const hapticHeavy = async () => {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return;
    } catch {}
  }
  if (navigator.vibrate) navigator.vibrate(80);
};

// ── Geolocation ────────────────────────────────────────────────────────────
export const getCurrentLocation = async () => {
  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== "granted") {
        const req = await Geolocation.requestPermissions();
        if (req.location !== "granted") return null;
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch (err) {
      console.warn("Native geolocation failed, falling back to browser:", err);
    }
  }
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
    );
  });
};

// Subscribe to continuous location updates. Returns an `unsubscribe` function.
// On native: uses Capacitor Geolocation.watchPosition.
// On web: uses navigator.geolocation.watchPosition with high accuracy.
export const watchLocation = (callback) => {
  let cancelled = false;
  let unsub = () => {};

  if (isNative()) {
    let watchId = null;
    (async () => {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== "granted") {
          const req = await Geolocation.requestPermissions();
          if (req.location !== "granted") return;
        }
        if (cancelled) return;
        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 10000 },
          (pos, err) => {
            if (cancelled || err || !pos) return;
            callback({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          }
        );
      } catch (err) {
        console.warn("Native watchLocation failed:", err);
      }
    })();
    unsub = async () => {
      cancelled = true;
      if (watchId) {
        try {
          const { Geolocation } = await import("@capacitor/geolocation");
          await Geolocation.clearWatch({ id: watchId });
        } catch {}
      }
    };
    return unsub;
  }

  // Web fallback
  if (!navigator.geolocation) return unsub;
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      if (cancelled) return;
      callback({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    },
    (err) => console.warn("watchPosition error:", err),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
  );
  unsub = () => {
    cancelled = true;
    navigator.geolocation.clearWatch(id);
  };
  return unsub;
};

// ── Emergency share — WhatsApp first ──────────────────────────────────────
// Priority order:
//   1. wa.me deep link (opens WhatsApp directly to a chat with the contact,
//      pre-filled with the live-location message).
//   2. Native system share sheet (Android Capacitor).
//   3. Web Share API (any modern mobile browser).
//   4. SMS deep link as last resort.
export const shareEmergency = async ({ title, text, fallbackPhone }) => {
  // 1. WhatsApp direct — by far the fastest path for the demo and what users
  //    expect: SOS lands directly in WhatsApp, ready to send.
  if (fallbackPhone) {
    const cleanPhone = fallbackPhone.replace(/[^\d+]/g, "");
    const waPhone = cleanPhone.replace(/^\+/, "");
    if (waPhone) {
      const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return { ok: true, channel: "whatsapp" };
    }
  }

  // 2. Capacitor native share (offers WhatsApp + SMS + Email + Signal).
  if (isNative()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, dialogTitle: title });
      return { ok: true, channel: "native" };
    } catch (err) {
      console.warn("Native share failed:", err);
    }
  }

  // 3. Web Share API.
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return { ok: true, channel: "web-share" };
    } catch {}
  }

  // 4. SMS fallback.
  if (fallbackPhone) {
    const cleanPhone = fallbackPhone.replace(/[^\d+]/g, "");
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
    return { ok: true, channel: "sms" };
  }
  return { ok: false, channel: "none" };
};

// ── Status bar tinting on native ───────────────────────────────────────────
export const tintStatusBar = async (style = "dark", color = "#FFFFFF") => {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: style === "dark" ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color });
  } catch {}
};

// ── Hide splash once app is ready ──────────────────────────────────────────
export const hideSplash = async () => {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {}
};

export { isNative };
