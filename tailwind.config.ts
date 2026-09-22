import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#130F2D",        // JCI Black
        paper: "#FFFFFF",      // JCI White
        blue: {
          DEFAULT: "#0097D7",  // JCI Blue (primary brand colour)
          light: "#33B5E8",
          dark: "#0077AD",     // accessible shade for small text on white
        },
        navy: "#1F4789",       // JCI Navy
        yellow: "#EFC40F",     // JCI Yellow
        teal: {
          DEFAULT: "#57BCBC",  // JCI Teal
          dark: "#267878",     // accessible shade for small text on white
        },
        danger: "#B3202A",     // semantic: errors / destructive
        success: "#1C6B3C",    // semantic: success / WhatsApp
        canvas: "#F5F8FB",     // SaaS app background
        line: "#130F2D",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
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
