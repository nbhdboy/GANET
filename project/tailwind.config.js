/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'line': {
          light: '#00E000',
          DEFAULT: '#00C300',
          dark: '#00B300',
        }
      },
      backgroundImage: {
        'line-gradient': 'linear-gradient(135deg, #00E000 0%, #00C300 100%)',
        'line-gradient-hover': 'linear-gradient(135deg, #00C300 0%, #00B300 100%)',
      },
    },
  },
  plugins: [],
};