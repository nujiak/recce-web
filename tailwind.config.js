/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'pin-red': 'var(--color-pin-red)',
        'pin-orange': 'var(--color-pin-orange)',
        'pin-green': 'var(--color-pin-green)',
        'pin-azure': 'var(--color-pin-azure)',
        'pin-violet': 'var(--color-pin-violet)',
      },
      fontFamily: {
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
