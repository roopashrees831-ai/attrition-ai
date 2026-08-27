/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#090612",
          surface: "#120B20",
          card: "#1A1030",
          border: "#3A245C",
          hover: "#25163F",
          purple: "#A855F7",
          lavender: "#C4B5FD",
          light: "#DDD6FE",
          glow: "rgba(196, 181, 253, 0.16)"
        },
        risk: {
          high: "#FB7185",
          medium: "#FBBF24",
          low: "#34D399"
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'purple-glow': '0 0 28px rgba(196, 181, 253, 0.22)',
        'purple-subtle': '0 8px 30px rgba(9, 6, 18, 0.7)',
      }
    },
  },
  plugins: [],
}
