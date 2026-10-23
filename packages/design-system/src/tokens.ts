/**
 * @birthub/design-system - Tokens de Design
 * Diretriz: Neon é acento; fundos e tipografia possuem contraste auditado (WCAG 2.2 AA).
 */

export const tokens = {
  colors: {
    background: {
      base: "#0B0E18",
      surface: "#101423",
      surfaceElevated: "#181E32",
      surfaceHover: "#1E2540",
      border: "#2A3352",
      borderSubtle: "#1C2339"
    },
    text: {
      primary: "#F2F5FF",
      secondary: "#B8C1DE",
      muted: "#7A84A7",
      inverse: "#0B0E18"
    },
    accent: {
      neonBlue: "#00E5FF",
      neonPink: "#FF007F",
      neonGold: "#FFD700",
      neonGreen: "#00FFA3"
    },
    status: {
      success: "#00FFA3",
      warning: "#FFB800",
      danger: "#FF3366",
      info: "#00E5FF"
    }
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "2rem"
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    6: "1.5rem",
    8: "2rem"
  },
  radii: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    full: "9999px"
  }
} as const;
