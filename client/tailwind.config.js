/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        }
      }
    }
  },
  plugins: []
};
