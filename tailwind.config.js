/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D97706',
          dark: '#B45309',
          light: '#FBBF24',
        },
      },
    },
  },
  plugins: [],
};
