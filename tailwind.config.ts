import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#6C4FF6",
          50:  "#EDE9FE",
          100: "#DDD6FD",
          200: "#C4B5FB",
          600: "#6C4FF6",
          700: "#5B3EE0",
          800: "#4C35C4",
          900: "#3D2BA8",
        },
        accent: {
          pink:  "#F472B6",
          green: "#34D399",
          amber: "#FBBF24",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F8F7FF",
          3: "#F1EFF8",
        },
        border: {
          DEFAULT: "#E8E5FF",
          strong: "#C4B5FB",
        },
        text: {
          1: "#1A1333",
          2: "#6B6885",
          3: "#A09DBF",
        },
      },
      borderRadius: {
        DEFAULT: "14px",
        sm: "8px",
        lg: "20px",
        xl: "24px",
        "2xl": "28px",
        full: "9999px",
      },
      boxShadow: {
        card:  "0 2px 12px rgba(108,79,246,0.08), 0 0 0 1px #E8E5FF",
        focus: "0 0 0 3px rgba(108,79,246,0.20)",
        lg:    "0 8px 32px rgba(108,79,246,0.12)",
      },
      animation: {
        "fade-up":   "fadeUp 0.3s ease both",
        "pulse-dot": "pulseDot 2s infinite",
        "spin":      "spin 0.8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      spacing: { "18": "4.5rem", "88": "22rem" },
      maxWidth: { "8xl": "88rem" },
      width: { "240": "240px", "280": "280px" },
      minWidth: { "240": "240px" },
    },
  },
  plugins: [],
};
export default config;
