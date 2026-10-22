/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FDF8F5',
          100: '#F7EDE6',
          200: '#EED9CC',
          500: '#A45D35',
          700: '#6A371B',
          800: '#4E2712',
          900: '#32190B',
        }
      }
    },
  },
  plugins: [],
};
