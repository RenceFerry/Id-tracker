import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // These map to CSS variables defined in app/globals.css, which
        // are swapped when the `dark` class is applied to <html>. Every
        // component using bg-paper/text-ink/etc. gets dark mode for free.
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        maroon: "var(--color-maroon)",
        "maroon-dark": "var(--color-maroon-dark)",
        sage: "var(--color-sage)",
        amber: "var(--color-amber)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
