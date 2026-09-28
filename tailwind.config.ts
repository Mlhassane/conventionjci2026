import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /* ---------------- JCI brand colours ---------------- */
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

        /* ---------------- shadcn/ui semantic tokens ---------------- */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
  plugins: [tailwindcssAnimate],
};

export default config;
