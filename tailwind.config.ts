import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Add keyframes for our flash effects
      keyframes: {
        flashCorrect: {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(4, 120, 87, 0)' },
          '50%': { 'box-shadow': '0 0 10px 5px rgba(5, 150, 105, 0.7)' },
        },
        flashIncorrect: {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(185, 28, 28, 0)' },
          '50%': { 'box-shadow': '0 0 10px 5px rgba(220, 38, 38, 0.7)' },
        },
      },
      // Add the animation utilities
      animation: {
        flashCorrect: 'flashCorrect 0.7s ease-in-out',
        flashIncorrect: 'flashIncorrect 0.7s ease-in-out',
      },
    },
  },
  plugins: [],
}
export default config
