/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'], // Define Outfit como padrão
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        // Novo Azul "Agradável" (Electric Blue suave)
        brand: {
          light: '#60a5fa', // Blue-400
          DEFAULT: '#3b82f6', // Blue-500
          dark: '#2563eb', // Blue-600
          glow: 'rgba(59, 130, 246, 0.5)'
        }
      }
    },
  },
  plugins: [],
}