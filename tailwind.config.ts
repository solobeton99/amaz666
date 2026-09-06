import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dfeaff",
          400: "#5b8def",
          500: "#3b6fe0",
          600: "#2f5bd6",
          700: "#2547ad",
        },
        navy: {
          950: "#050b1e",
          900: "#0a1330",
          800: "#101b45",
          700: "#182658",
          600: "#22366e",
          500: "#2c4380",
        },
      },
    },
  },
  plugins: [],
};
export default config;
