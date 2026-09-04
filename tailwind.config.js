/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F1",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#14162B",
          soft: "#3B3D57",
          faint: "#84869C",
          50: "#F3F3F7",
        },
        moss: {
          DEFAULT: "#1F6F54",
          dark: "#164F3C",
          light: "#E4F0EA",
        },
        amber: {
          DEFAULT: "#D98E04",
          light: "#FBEDCE",
        },
        signal: {
          DEFAULT: "#E1436F",
          light: "#FCE4EB",
        },
        line: "#E7E3D8",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 22, 43, 0.06), 0 12px 28px rgba(20, 22, 43, 0.05)",
        "card-hover": "0 4px 10px rgba(20, 22, 43, 0.08), 0 20px 40px rgba(20, 22, 43, 0.09)",
        glow: "0 0 0 1px rgba(217, 142, 4, 0.25), 0 8px 24px rgba(217, 142, 4, 0.18)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(1.8)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
