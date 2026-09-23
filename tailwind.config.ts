import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand colours (JCI Brand Guidelines)
        ink: "#130F2D",        // JCI Black
        paper: "#FFFFFF",      // JCI White
        blue: {
          DEFAULT: "#0097D7",  // JCI Blue
          light: "#33B5E8",
          dark: "#0077AD",     // accessible shade for small text on white
        },
        // Secondary brand colours — use sparingly
        navy: "#1F4789",       // JCI Navy
        yellow: "#EFC40F",     // JCI Yellow (accent only)
        teal: {
          DEFAULT: "#57BCBC",  // JCI Teal
          dark: "#267878",
        },
        // Semantic / app (non-brand)
        danger: "#B3202A",
        success: "#1C6B3C",
        canvas: "#F5F8FB",
        line: "#130F2D",
      },
      fontFamily: {
        // Primary: Plus Jakarta Sans (headings + body)
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        serif: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        // Secondary: Arvo — large quotes / editorial callouts only
        quote: ["var(--font-arvo)", "Georgia", "serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      letterSpacing: {
        wide2: "0.14em",
      },
      boxShadow: {
        soft: "0 12px 40px -20px rgba(19,15,45,0.35)",
        card: "0 1px 2px rgba(19,15,45,0.05), 0 10px 30px -18px rgba(19,15,45,0.25)",
        lift: "0 2px 4px rgba(19,15,45,0.06), 0 18px 44px -22px rgba(19,15,45,0.35)",
        nav: "0 1px 0 rgba(19,15,45,0.05), 0 10px 28px -18px rgba(19,15,45,0.4)",
        cta: "0 1px 2px rgba(19,15,45,0.1), 0 10px 24px -10px rgba(0,151,215,0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
