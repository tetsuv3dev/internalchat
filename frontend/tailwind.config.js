/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'ultrawide': '2560px',
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        chat: {
          bg: '#1a1b1e',
          sidebar: '#25262b',
          input: '#2c2d32',
          hover: '#2e2f34',
          border: '#373a40',
          text: '#c1c2c5',
          muted: '#909296',
        },
      },
    },
  },
  plugins: [],
};
