// ResQ AI design tokens. Calm, clinical, minimalist.
// Red used sparingly — only where it conveys actual emergency action.

export const tokens = {
  color: {
    bg: "#F5F7FA",
    surface: "#FFFFFF",
    surfaceMuted: "#F8FAFC",
    surfaceSubtle: "#F1F5F9",
    text: "#0F172A",
    textMuted: "#475569",
    textSubtle: "#94A3B8",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",
    divider: "#F1F5F9",

    primary: "#0F172A",
    primaryHover: "#1E293B",
    accent: "#4F46E5",

    danger: "#DC2626",
    dangerHover: "#B91C1C",
    dangerBg: "#FEF2F2",
    dangerBorder: "#FECACA",

    success: "#16A34A",
    successBg: "#F0FDF4",
    successBorder: "#BBF7D0",

    warning: "#D97706",
    warningBg: "#FFFBEB",
    warningBorder: "#FDE68A",

    info: "#2563EB",
    infoBg: "#EFF6FF",

    // Emergency category accents — desaturated, not playground bright.
    medical: "#DC2626",
    fire: "#EA580C",
    accident: "#D97706",
    crime: "#7C3AED",
    disaster: "#0284C7",
    home: "#059669",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    pill: "9999px",
  },
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02)",
    md: "0 4px 12px rgba(15,23,42,0.05), 0 2px 4px rgba(15,23,42,0.03)",
    lg: "0 12px 32px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.04)",
    danger: "0 8px 24px rgba(220,38,38,0.18)",
  },
  font: {
    family:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  container: {
    sm: "720px",
    md: "1024px",
    lg: "1200px",
    xl: "1360px",
  },
  breakpoint: {
    sm: "640px",
    md: "900px",
    lg: "1100px",
  },
};

// ─── Reusable component primitives (inline-style objects) ────────────────

export const styles = {
  page: {
    minHeight: "100vh",
    background: tokens.color.bg,
    fontFamily: tokens.font.family,
    color: tokens.color.text,
    WebkitFontSmoothing: "antialiased",
  },
  appBar: {
    background: tokens.color.surface,
    borderBottom: `1px solid ${tokens.color.border}`,
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
    backdropFilter: "saturate(180%) blur(16px)",
  },
  appBarTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: tokens.color.text,
    letterSpacing: "-0.01em",
    margin: 0,
  },
  card: {
    background: tokens.color.surface,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.sm,
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: tokens.color.textSubtle,
    margin: "0 0 10px 4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  // Primary CTA (dark, used for confirm/submit)
  primaryBtn: {
    background: tokens.color.primary,
    color: "#fff",
    border: "none",
    borderRadius: tokens.radius.md,
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: tokens.font.family,
    transition: "background 0.15s",
  },
  // Secondary (neutral)
  secondaryBtn: {
    background: tokens.color.surface,
    color: tokens.color.text,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: tokens.font.family,
  },
  // Ghost text-only button
  ghostBtn: {
    background: "transparent",
    color: tokens.color.textMuted,
    border: "none",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: tokens.font.family,
  },
  iconBtn: {
    width: "36px",
    height: "36px",
    borderRadius: tokens.radius.pill,
    background: tokens.color.surfaceSubtle,
    border: `1px solid ${tokens.color.border}`,
    color: tokens.color.textMuted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontFamily: tokens.font.family,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    background: tokens.color.surface,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    padding: "12px 14px",
    fontSize: "15px",
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
};

export default tokens;
