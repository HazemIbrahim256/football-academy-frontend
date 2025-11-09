import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        academy: {
          green: "#16a34a",
          dark: "#111827",
          light: "#f9fafb",
        },
        brand: {
          red: "#8F1E1E",
          maroon: "#3A1D1D",
          black: "#000000",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;