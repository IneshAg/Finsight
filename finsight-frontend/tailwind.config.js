export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: '#22c55e',
        surface: '#111827',
        base: '#0d1117',
        danger: '#ef4444',
        warning: '#f59e0b',
        muted: '#6b7280',
      }
    },
  },
  plugins: [],
}
