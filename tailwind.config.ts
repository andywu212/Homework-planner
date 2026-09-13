import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sakura-dark palette: near-black surfaces, a warm deep-red accent
        // (streak flame, progress fill, active nav) instead of a cool blue.
        bg: "#0d0d0d",
        surface: "#161616",
        surface2: "#1e1e1e",
        border: "#2b2b2b",
        text: "#f2f2f2",
        muted: "#8a8a8a",
        accent: "#c0392b",
        accentSoft: "#e08a7d",
        good: "#2e8b57",
        warn: "#e0a83a",
        bad: "#d9564a",
      },
    },
  },
  plugins: [],
};
export default config;
