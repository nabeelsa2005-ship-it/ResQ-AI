import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import LangPickerModal from "./LangPickerModal";
import { tokens, styles as S } from "../theme";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/guidance", label: "Ask AI" },
  { to: "/nearby", label: "Nearby" },
];

export default function AppShell() {
  const { user, primaryLang, selectedLanguages, logout } = useAppContext();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={shellPage}>
      <style>{`
        body { background: ${tokens.color.bg}; }
        * { -webkit-tap-highlight-color: transparent; }
        .nav-link {
          color: ${tokens.color.textMuted};
          padding: 8px 14px;
          border-radius: ${tokens.radius.md};
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .nav-link:hover { background: ${tokens.color.surfaceSubtle}; color: ${tokens.color.text}; }
        .nav-link.active {
          color: ${tokens.color.text};
          background: ${tokens.color.surfaceSubtle};
          font-weight: 600;
        }
        .user-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          background: ${tokens.color.surface};
          border: 1px solid ${tokens.color.border};
          border-radius: ${tokens.radius.md};
          box-shadow: ${tokens.shadow.lg};
          min-width: 200px;
          padding: 6px;
          z-index: 50;
        }
        .menu-item {
          display: block;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          text-align: left;
          font-size: 14px;
          color: ${tokens.color.text};
          font-family: inherit;
          cursor: pointer;
          border-radius: ${tokens.radius.sm};
        }
        .menu-item:hover { background: ${tokens.color.surfaceSubtle}; }
        .menu-meta {
          font-size: 11px;
          color: ${tokens.color.textSubtle};
          padding: 8px 12px 4px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .hamburger { display: none; }
        @media (max-width: 820px) {
          .nav-links-desktop { display: none !important; }
          .hamburger { display: flex !important; }
          .user-name-text { display: none; }
        }
        @media (max-width: 480px) {
          .nav-call-label { display: none; }
        }
        .mobile-nav-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.4);
          z-index: 60;
          backdrop-filter: blur(2px);
        }
        .mobile-nav-sheet {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: min(320px, 88vw);
          background: ${tokens.color.surface};
          z-index: 61;
          box-shadow: ${tokens.shadow.lg};
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          font-size: 16px;
          font-weight: 600;
          color: ${tokens.color.text};
          text-decoration: none;
          border-radius: ${tokens.radius.md};
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: ${tokens.color.surfaceSubtle};
        }
      `}</style>

      {langOpen && <LangPickerModal onClose={() => setLangOpen(false)} />}

      {/* Top nav */}
      <header style={topNav}>
        <div style={navInner}>
          <button onClick={() => navigate("/")} style={brandBtn}>
            <span style={brandDot} />
            <span style={brandText}>ResQ AI</span>
          </button>

          <nav className="nav-links-desktop" style={navLinks}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={navRight}>
            <a href="tel:112" style={callBtn} title="Call 112">
              <span style={callBtnDot} /> <span className="nav-call-label">112</span>
            </a>
            <button
              className="hamburger"
              style={S.iconBtn}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <button
              style={S.iconBtn}
              onClick={() => setLangOpen(true)}
              title="Change language"
              aria-label="Change language"
            >
              🌐
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={userBtn}
                aria-label="Account menu"
              >
                <span style={userInitial}>
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </span>
                <span className="user-name-text" style={userName}>{user?.name || "Guest"}</span>
                <span className="user-name-text" style={{ color: tokens.color.textSubtle, fontSize: "10px" }}>▼</span>
              </button>
              {menuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="user-menu">
                    <div className="menu-meta">Signed in as</div>
                    <div style={{ padding: "4px 12px 8px", fontSize: "13px", color: tokens.color.text, fontWeight: 600 }}>
                      {user?.name}
                    </div>
                    <div style={{ padding: "0 12px 8px", fontSize: "12px", color: tokens.color.textSubtle }}>
                      {user?.email}
                    </div>
                    <div style={{ height: "1px", background: tokens.color.border, margin: "4px 0" }} />
                    <div className="menu-meta">Languages</div>
                    <div style={{ padding: "0 12px 8px", fontSize: "12px", color: tokens.color.textMuted }}>
                      {selectedLanguages?.join(" · ") || primaryLang}
                    </div>
                    <button
                      className="menu-item"
                      onClick={() => { setMenuOpen(false); setLangOpen(true); }}
                    >
                      Change languages
                    </button>
                    <div style={{ height: "1px", background: tokens.color.border, margin: "4px 0" }} />
                    <button
                      className="menu-item"
                      style={{ color: tokens.color.danger, fontWeight: 600 }}
                      onClick={logout}
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
          <aside className="mobile-nav-sheet" role="dialog" aria-label="Navigation">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={brandDot} />
                <span style={brandText}>ResQ AI</span>
              </div>
              <button
                style={S.iconBtn}
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
                onClick={() => setMobileNavOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div style={{ height: "1px", background: tokens.color.border, margin: "12px 0" }} />
            <button
              className="mobile-nav-link"
              style={{ background: "transparent", border: "none", textAlign: "left", fontFamily: tokens.font.family, cursor: "pointer", width: "100%" }}
              onClick={() => { setMobileNavOpen(false); setLangOpen(true); }}
            >
              🌐 Change languages
            </button>
            <button
              className="mobile-nav-link"
              style={{ background: "transparent", border: "none", textAlign: "left", fontFamily: tokens.font.family, cursor: "pointer", width: "100%", color: tokens.color.danger }}
              onClick={logout}
            >
              Log out
            </button>
            <div style={{ marginTop: "auto", paddingTop: "16px", fontSize: "12px", color: tokens.color.textSubtle }}>
              Signed in as<br />
              <strong style={{ color: tokens.color.text, fontWeight: 600 }}>{user?.name}</strong>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>
                Languages: {selectedLanguages?.join(", ") || primaryLang}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Page content */}
      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const shellPage = {
  minHeight: "100vh",
  background: tokens.color.bg,
  fontFamily: tokens.font.family,
  color: tokens.color.text,
};

const topNav = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "saturate(180%) blur(16px)",
  WebkitBackdropFilter: "saturate(180%) blur(16px)",
  borderBottom: `1px solid ${tokens.color.border}`,
};

const navInner = {
  maxWidth: "1600px",
  margin: "0 auto",
  padding: "12px 32px",
  display: "flex",
  alignItems: "center",
  gap: "24px",
};

const brandBtn = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "4px 4px 4px 0",
  fontFamily: tokens.font.family,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const brandDot = {
  width: "10px",
  height: "10px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.danger,
  boxShadow: "0 0 0 3px rgba(220,38,38,0.18)",
  flexShrink: 0,
};

const brandText = {
  fontSize: "16px",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  color: tokens.color.text,
  whiteSpace: "nowrap",
};

const navLinks = {
  display: "flex",
  gap: "4px",
  alignItems: "center",
};

const navRight = {
  marginLeft: "auto",
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const callBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 14px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.danger,
  color: "#fff",
  fontWeight: 700,
  fontSize: "13px",
  fontVariantNumeric: "tabular-nums",
  textDecoration: "none",
  letterSpacing: "0.02em",
  boxShadow: "0 4px 12px rgba(220,38,38,0.25)",
};

const callBtnDot = {
  width: "6px",
  height: "6px",
  borderRadius: tokens.radius.pill,
  background: "#fff",
  boxShadow: "0 0 0 2px rgba(255,255,255,0.5)",
};

const userBtn = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.pill,
  padding: "5px 12px 5px 5px",
  cursor: "pointer",
  fontFamily: tokens.font.family,
};

const userInitial = {
  width: "28px",
  height: "28px",
  borderRadius: tokens.radius.pill,
  background: tokens.color.text,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 700,
};

const userName = {
  fontSize: "13px",
  fontWeight: 600,
  color: tokens.color.text,
};

const mainStyle = {
  width: "100%",
};
