import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    // Vite + React renderer
    "./renderer/index.html",
    "./renderer/src/**/*.{js,ts,jsx,tsx}",
    // include any global styles or other front-end assets if needed
    "./styles/**/*.{css}",
  ],
  theme: {
    extend: {
      colors: {
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: {
            DEFAULT: "hsl(var(--sidebar-primary))",
            foreground: "hsl(var(--sidebar-primary-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--sidebar-accent))",
            foreground: "hsl(var(--sidebar-accent-foreground))",
          },
          border: "hsl(var(--sidebar-border))",
        },
      },
      // keep font/borderRadius and other design tokens as-is
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        // 8-color cycle at 0.5 alpha (smooth via @property --glow)
        glow8: {
          "0%":    { "--glow": "rgba(239,68,68,0.8)" },   // red-500
          "12.5%": { "--glow": "rgba(249,115,22,0.8)" },  // orange-500
          "25%":   { "--glow": "rgba(245,158,11,0.8)" },  // amber-500
          "37.5%": { "--glow": "rgba(34,197,94,0.8)" },   // green-500
          "50%":   { "--glow": "rgba(13,148,136,0.8)" },  // teal-600
          "62.5%": { "--glow": "rgba(59,130,246,0.8)" },  // blue-500
          "75%":   { "--glow": "rgba(123,0,255,0.8)" },   // purple
          "87.5%": { "--glow": "rgba(217,70,239,0.8)" },  // fuchsia-500
          "100%":  { "--glow": "rgba(239,68,68,0.8)" },   // back to red
        },

        // Pulse size + brightness
        "pulse-light": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%":      { transform: "scale(1.2)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        glow8: "glow8 16s ease-in-out infinite",
        "pulse-light": "pulse-light 4s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
