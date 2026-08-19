/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deliberately not blue-500/green-500 defaults — a finance app
        // where every other tutorial project already looks like this.
        ink: '#151316',
        paper: '#FAF9F6',
        accent: '#2F5D50',
        danger: '#B3403A',
        muted: '#8A8580',
        line: '#E5E2DC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
