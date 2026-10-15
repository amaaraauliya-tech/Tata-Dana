import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50, #FFF7ED)",
          100: "var(--brand-100, #FFEDD5)",
          200: "var(--brand-200, #FED7AA)",
          300: "var(--brand-300, #FDBA74)",
          400: "var(--brand-400, #FB923C)",
          500: "var(--brand-500, #F97316)",
          600: "var(--brand-600, #EA580C)",
          700: "var(--brand-700, #C2410C)",
          800: "var(--brand-800, #9A3412)",
          900: "var(--brand-900, #7C2D12)",
          950: "var(--brand-950, #431407)",
        },
        surface: {
          light: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          dark: "#0F172A",
        },
        fintech: {
          green: "#10B981",
          red: "#EF4444",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          amber: "#F59E0B"
        }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        premium: "0 10px 30px -5px rgba(249, 115, 22, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
        orangeGlow: "0 0 25px -3px rgba(249, 115, 22, 0.35)",
      }
    },
  },
  plugins: [],
};
export default config;
