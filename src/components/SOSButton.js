import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { tokens, styles as S } from "../theme";
import { hapticTick, hapticSuccess, getCurrentLocation, watchLocation, shareEmergency } from "../utils/native";
import LocationMap from "./LocationMap";

const HOLD_MS = 2000;

const SOS_TEXTS = {
  English: {
    title: "Emergency SOS",
    sub: "Hold for 2 seconds to share your live location with your contacts.",
    btnIdle: "Hold to send SOS",
    btnHolding: "Keep holding…",
    btnSending: "Sending…",
    btnSent: "SOS sent",
    contacts: "Trusted contacts",
    addContact: "Add contact",
    contactNamePh: "Name (e.g. Mom)",
    contactPhonePh: "+91 9876543210",
    save: "Save",
    cancel: "Cancel",
    noContacts: "Add at least one trusted contact to enable SOS.",
    locating: "Getting your location…",
    locFailed: "Location unavailable — sending without GPS.",
    msgPrefix: "EMERGENCY — I need help.",
    msgLocLine: "Live location:",
    msgNoLoc: "(Location unavailable. Please call me.)",
    sentTo: "Sent to",
  },
  Hindi: {
    title: "आपातकालीन SOS",
    sub: "अपना लाइव स्थान संपर्कों को भेजने के लिए 2 सेकंड दबाए रखें।",
    btnIdle: "SOS के लिए दबाए रखें",
    btnHolding: "दबाए रखें…",
    btnSending: "भेजा जा रहा…",
    btnSent: "SOS भेज दिया",
    contacts: "विश्वसनीय संपर्क",
    addContact: "संपर्क जोड़ें",
    contactNamePh: "नाम (जैसे मम्मी)",
    contactPhonePh: "+91 9876543210",
    save: "सहेजें",
    cancel: "रद्द",
    noContacts: "SOS सक्षम करने के लिए कम से कम एक संपर्क जोड़ें।",
    locating: "स्थान प्राप्त किया जा रहा है…",
    locFailed: "स्थान उपलब्ध नहीं — GPS के बिना भेजा जा रहा है।",
    msgPrefix: "आपातकाल — मुझे मदद चाहिए।",
    msgLocLine: "लाइव स्थान:",
    msgNoLoc: "(स्थान उपलब्ध नहीं — कृपया कॉल करें।)",
    sentTo: "भेजा गया",
  },
};

const getSOSText = (lang) => SOS_TEXTS[lang] || SOS_TEXTS.English;

// Format the SOS message. Each section sits on its own line so WhatsApp
// renders the maps URL on its own row (which makes it tappable + previewable).
const buildMessage = (st, location, emergencyType) => {
  const parts = [st.msgPrefix];
  if (emergencyType) parts.push(`Type: ${emergencyType}`);
  if (location && Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    const lat = location.lat.toFixed(6);
    const lng = location.lng.toFixed(6);
    // Two URL formats — first one renders a map preview in WhatsApp; second
    // is plain coords as a safety net if the receiver's WhatsApp blocks
    // link previews.
    parts.push(""); // blank line — gives WhatsApp link-preview room
    parts.push(`📍 ${st.msgLocLine}`);
    parts.push(`https://www.google.com/maps?q=${lat},${lng}`);
    if (location.accuracy) {
      parts.push(`(GPS accuracy: ±${Math.round(location.accuracy)}m)`);
    }
    parts.push(`Coords: ${lat}, ${lng}`);
  } else {
    parts.push(st.msgNoLoc);
  }
  parts.push("");
  parts.push(`— Sent from ResQ AI · ${new Date().toLocaleTimeString()}`);
  return parts.join("\n");
};

export default function SOSButton({ emergencyType }) {
  const { primaryLang, emergencyContacts, saveEmergencyContacts } = useAppContext();
  const st = getSOSText(primaryLang);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | holding | sending | sent | error
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [liveLocation, setLiveLocation] = useState(null);
  const [locStatus, setLocStatus] = useState("acquiring"); // acquiring | live | denied | unavailable

  const holdRef = useRef(null);
  const tickRef = useRef(null);
  const startedAtRef = useRef(0);
  const lastLocRef = useRef(null);

  const clearHold = useCallback(() => {
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, []);

  useEffect(() => () => clearHold(), [clearHold]);

  // Eagerly request GPS permission and start a live watcher.
  // We probe the Permissions API first so we know whether to surface a
  // "blocked" UI vs an "acquiring" state.
  const startLocationFlow = useCallback(() => {
    let cancelled = false;
    let unsub = () => {};
    setLocStatus("acquiring");

    // Probe permission state if available — Chrome/Firefox expose this.
    const probe = async () => {
      try {
        if (navigator.permissions?.query) {
          const p = await navigator.permissions.query({ name: "geolocation" });
          if (p.state === "denied") {
            setLocStatus("denied");
            return false;
          }
        }
      } catch {}
      return true;
    };

    probe().then((proceed) => {
      if (cancelled || !proceed) return;
      // One-shot first so the map paints quickly.
      getCurrentLocation().then((loc) => {
        if (cancelled) return;
        if (!loc) {
          if (locStatus === "acquiring") setLocStatus("unavailable");
          return;
        }
        lastLocRef.current = loc;
        setLiveLocation(loc);
        setLocStatus("live");
      }).catch(() => {
        if (!cancelled) setLocStatus("denied");
      });

      // Continuous watcher.
      unsub = watchLocation((loc) => {
        lastLocRef.current = loc;
        setLiveLocation(loc);
        setLocStatus("live");
      });
    });

    return () => {
      cancelled = true;
      try { unsub && unsub(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const teardown = startLocationFlow();
    return teardown;
  }, [startLocationFlow]);

  const triggerSOS = async () => {
    if (!emergencyContacts || emergencyContacts.length === 0) {
      setStatusMsg(st.noContacts);
      setStatus("error");
      setShowAdd(true);
      return;
    }
    setStatus("sending");
    setStatusMsg(st.locating);

    // Prefer the live-watched location. If it's not there yet, try a fresh
    // one-shot fetch with a generous timeout. We keep going either way —
    // sending an SOS without GPS is still better than not sending at all,
    // and the message clearly states the location was unavailable.
    let location = lastLocRef.current;
    if (!location) {
      try {
        location = await Promise.race([
          getCurrentLocation(),
          new Promise((resolve) => setTimeout(() => resolve(null), 6000)),
        ]);
      } catch {
        location = null;
      }
      if (location) {
        lastLocRef.current = location;
        setLiveLocation(location);
        setLocStatus("live");
      }
    }
    if (!location) setStatusMsg(st.locFailed);

    const message = buildMessage(st, location, emergencyType);
    const primary = emergencyContacts[0];

    // Belt-and-braces: copy the message to the clipboard so the user can
    // paste it into any chat if WhatsApp's deep link gets stripped of newlines
    // or special characters by their device.
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
      }
    } catch {}

    const result = await shareEmergency({
      title: "Emergency SOS",
      text: message,
      fallbackPhone: primary.phone,
    });

    if (result.ok) {
      setStatus("sent");
      const channelLabel =
        result.channel === "whatsapp" ? "WhatsApp" :
        result.channel === "sms" ? "SMS" :
        result.channel === "native" ? "share sheet" : "share";
      const locTag = location ? "with live location" : "without location";
      setStatusMsg(`${st.sentTo} ${primary.name} via ${channelLabel} (${locTag}). Message also copied to clipboard.`);
    } else {
      const cleanPhone = primary.phone.replace(/[^\d+]/g, "");
      window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
      setStatus("sent");
      setStatusMsg(`${st.sentTo} ${primary.name}`);
    }

    await hapticSuccess();

    setTimeout(() => {
      setStatus("idle");
      setStatusMsg("");
      setProgress(0);
    }, 6000);
  };

  const handleStart = () => {
    if (status === "sending" || status === "sent") return;
    setStatus("holding");
    setProgress(0);
    startedAtRef.current = Date.now();
    hapticTick();

    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setProgress(Math.min(100, (elapsed / HOLD_MS) * 100));
    }, 30);

    holdRef.current = setTimeout(() => {
      clearHold();
      setProgress(100);
      triggerSOS();
    }, HOLD_MS);
  };

  const handleEnd = () => {
    if (status !== "holding") return;
    clearHold();
    setStatus("idle");
    setProgress(0);
  };

  const handleAddContact = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) return;
    if (!/^\+?\d{7,15}$/.test(trimmedPhone.replace(/\s/g, ""))) {
      setStatusMsg("Enter digits, optionally with +country code.");
      setStatus("error");
      return;
    }
    saveEmergencyContacts([...emergencyContacts, { name: trimmedName, phone: trimmedPhone }]);
    setName("");
    setPhone("");
    setShowAdd(false);
    setStatusMsg("");
    setStatus("idle");
  };

  const handleRemoveContact = (idx) => {
    saveEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx));
  };

  const isLive = status === "holding" || status === "sending";
  const isDone = status === "sent";
  const btnLabel = isDone ? st.btnSent
    : status === "sending" ? st.btnSending
    : status === "holding" ? st.btnHolding
    : st.btnIdle;

  return (
    <div style={{ ...S.card, padding: "20px" }}>
      <style>{`
        .sos-btn:hover { box-shadow: ${tokens.shadow.danger}; }
        .sos-btn:active { transform: scale(0.99); }
        .sos-input:focus { border-color: ${tokens.color.primary} !important;
                           box-shadow: 0 0 0 3px rgba(15,23,42,0.06) !important; }
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={titleRow}>
            <span style={{
              ...statusDot,
              background: isLive ? tokens.color.danger : isDone ? tokens.color.success : tokens.color.danger,
              animation: isLive ? "sos-pulse 1.2s ease-out infinite" : "none",
            }} />
            <h2 style={titleText}>{st.title}</h2>
          </div>
          <p style={subText}>{st.sub}</p>
        </div>
      </div>

      {/* GPS status row */}
      <div style={gpsRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            ...gpsDot,
            background:
              locStatus === "live" ? tokens.color.success
              : locStatus === "denied" ? tokens.color.danger
              : tokens.color.warning,
            boxShadow:
              locStatus === "live" ? "0 0 0 3px rgba(22,163,74,0.25)"
              : locStatus === "denied" ? "0 0 0 3px rgba(220,38,38,0.25)"
              : "0 0 0 3px rgba(217,119,6,0.18)",
          }} />
          <span style={gpsLabel}>
            {locStatus === "live" && (liveLocation
              ? `GPS active · ±${Math.round(liveLocation.accuracy || 0)}m`
              : "GPS active")}
            {locStatus === "acquiring" && "Acquiring GPS…"}
            {locStatus === "unavailable" && "GPS unavailable on this device"}
            {locStatus === "denied" && "Location permission blocked"}
          </span>
        </div>
        {(locStatus === "denied" || locStatus === "unavailable" || locStatus === "acquiring") && (
          <button
            type="button"
            style={gpsRetryBtn}
            onClick={() => startLocationFlow()}
          >
            Retry
          </button>
        )}
      </div>

      {/* Live location preview — updates as you move; this is what gets sent. */}
      <div style={{ marginBottom: "12px" }}>
        <LocationMap
          location={liveLocation}
          accuracy={liveLocation?.accuracy}
          compact
          status={locStatus === "live" ? "live" : "stale"}
        />
        <p style={mapCaption}>
          {liveLocation
            ? "This live location is included in every SOS message. Tap below to preview the exact message."
            : "Once GPS locks on, your live coords are added to the SOS automatically."}
        </p>
        <button
          type="button"
          style={previewBtn}
          onClick={() => {
            const msg = buildMessage(st, liveLocation || lastLocRef.current, emergencyType);
            // eslint-disable-next-line no-alert
            window.alert(`This is what your contact will receive on WhatsApp:\n\n${msg}`);
          }}
        >
          Preview message →
        </button>
      </div>

      {/* Hold button */}
      <button
        type="button"
        className="sos-btn"
        style={{
          ...holdBtn,
          background: isDone ? tokens.color.success : tokens.color.danger,
          boxShadow: isLive ? tokens.shadow.danger : tokens.shadow.md,
        }}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => { e.preventDefault(); handleStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); handleEnd(); }}
        onTouchCancel={handleEnd}
        aria-label="Hold for SOS"
      >
        <span style={{ ...holdBtnFill, width: `${progress}%` }} />
        <span style={holdBtnLabel}>{btnLabel}</span>
      </button>

      {statusMsg && (
        <p style={{
          ...statusText,
          color: status === "sent" ? tokens.color.success
              : status === "error" ? tokens.color.danger
              : tokens.color.textMuted,
        }}>
          {statusMsg}
        </p>
      )}

      {/* Contacts */}
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={contactsHead}>{st.contacts}</span>
          <button
            type="button"
            style={{ ...S.ghostBtn, color: tokens.color.danger, fontWeight: 600 }}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "Cancel" : `+ ${st.addContact}`}
          </button>
        </div>

        {emergencyContacts.length === 0 && !showAdd && (
          <p style={emptyText}>{st.noContacts}</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {emergencyContacts.map((c, i) => (
            <div key={`${c.phone}-${i}`} style={contactRow}>
              <div style={contactInitial}>{c.name?.[0]?.toUpperCase() || "?"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={contactName}>{c.name}</div>
                <div style={contactPhone}>{c.phone}</div>
              </div>
              <button
                type="button"
                style={removeBtn}
                onClick={() => handleRemoveContact(i)}
                aria-label={`Remove ${c.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {showAdd && (
          <div style={addForm}>
            <input
              className="sos-input"
              style={{ ...S.input, fontSize: "14px" }}
              type="text"
              placeholder={st.contactNamePh}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="sos-input"
              style={{ ...S.input, fontSize: "14px", marginTop: "8px", fontFamily: tokens.font.mono }}
              type="tel"
              placeholder={st.contactPhonePh}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                type="button"
                style={{ ...S.secondaryBtn, flex: 1 }}
                onClick={() => { setShowAdd(false); setName(""); setPhone(""); setStatusMsg(""); setStatus("idle"); }}
              >
                {st.cancel}
              </button>
              <button
                type="button"
                style={{ ...S.primaryBtn, flex: 1 }}
                onClick={handleAddContact}
              >
                {st.save}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const titleRow = { display: "flex", alignItems: "center", gap: "8px" };

const statusDot = {
  width: "10px",
  height: "10px",
  borderRadius: tokens.radius.pill,
  flexShrink: 0,
};

const titleText = {
  fontSize: "16px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.01em",
  color: tokens.color.text,
};

const subText = {
  fontSize: "13px",
  color: tokens.color.textMuted,
  margin: "4px 0 0",
  lineHeight: 1.5,
};

const mapCaption = {
  fontSize: "11px",
  color: tokens.color.textSubtle,
  margin: "8px 2px 0",
  lineHeight: 1.4,
};

const gpsRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  background: tokens.color.surfaceSubtle,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  padding: "8px 12px",
  marginBottom: "10px",
};

const gpsDot = {
  width: 8,
  height: 8,
  borderRadius: tokens.radius.pill,
};

const gpsLabel = {
  fontSize: "12px",
  fontWeight: 600,
  color: tokens.color.textMuted,
};

const gpsRetryBtn = {
  background: "transparent",
  border: "none",
  color: tokens.color.danger,
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: tokens.font.family,
};

const previewBtn = {
  background: "transparent",
  border: "none",
  color: tokens.color.textMuted,
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  padding: "4px 0",
  marginTop: "6px",
};

const holdBtn = {
  position: "relative",
  width: "100%",
  height: "64px",
  borderRadius: tokens.radius.md,
  border: "none",
  color: "#fff",
  fontFamily: tokens.font.family,
  cursor: "pointer",
  overflow: "hidden",
  userSelect: "none",
  WebkitUserSelect: "none",
  touchAction: "manipulation",
  transition: "box-shadow 0.2s, transform 0.1s, background 0.2s",
};

const holdBtnFill = {
  position: "absolute",
  top: 0, bottom: 0, left: 0,
  background: "rgba(255,255,255,0.18)",
  transition: "width 0.05s linear",
};

const holdBtnLabel = {
  position: "relative",
  fontSize: "15px",
  fontWeight: 700,
  letterSpacing: "0.01em",
};

const statusText = {
  fontSize: "13px",
  fontWeight: 500,
  margin: "10px 0 0",
  textAlign: "center",
};

const contactsHead = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.color.textSubtle,
};

const emptyText = {
  fontSize: "13px",
  color: tokens.color.textSubtle,
  margin: 0,
  fontStyle: "italic",
};

const contactRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 12px",
  background: tokens.color.surfaceSubtle,
  borderRadius: tokens.radius.md,
};

const contactInitial = {
  width: "32px",
  height: "32px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  color: tokens.color.text,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "13px",
  flexShrink: 0,
};

const contactName = {
  fontSize: "14px",
  fontWeight: 600,
  color: tokens.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const contactPhone = {
  fontSize: "12px",
  color: tokens.color.textSubtle,
  fontFamily: tokens.font.mono,
};

const removeBtn = {
  background: "transparent",
  border: "none",
  color: tokens.color.textSubtle,
  fontSize: "20px",
  width: "28px",
  height: "28px",
  borderRadius: tokens.radius.pill,
  cursor: "pointer",
  fontFamily: tokens.font.family,
  flexShrink: 0,
};

const addForm = {
  marginTop: "10px",
  padding: "12px",
  background: tokens.color.surfaceSubtle,
  borderRadius: tokens.radius.md,
};
