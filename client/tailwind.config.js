/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FDFBF7',
          alt: '#F7F5F0',
          muted: '#EFECE6',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          muted: '#4A4A46',
          light: '#767670',
        },
        sage: {
          DEFAULT: '#7A9A48',
          surface: '#EBF2DF',
          dark: '#658239',
        },
        olive: {
          DEFAULT: '#6E8B3D',
          dark: '#587030',
        },
        terracotta: {
          DEFAULT: '#C85A48',
          light: '#F8ECE9',
        },
        border: {
          subtle: '#E5E2DB',
          strong: '#D3CEB6',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Cormorant Garamond', 'Noto Serif Ethiopic', 'Georgia', 'serif'],
        script: ['Caveat', 'cursive'],
        sans: ['Inter', 'Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 4px 20px -2px rgba(26, 26, 26, 0.05), 0 2px 6px -1px rgba(26, 26, 26, 0.02)',
        'paper-lg': '0 10px 30px -4px rgba(26, 26, 26, 0.08), 0 4px 12px -2px rgba(26, 26, 26, 0.03)',
      },
    },
  },
  plugins: [],
};
