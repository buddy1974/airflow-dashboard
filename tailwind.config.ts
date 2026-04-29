import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00ABA8',
          50:  '#E6F7F7',
          100: '#CCEFEF',
          200: '#99DFDE',
          300: '#66CFCE',
          400: '#33BFBD',
          500: '#00ABA8',
          600: '#008A87',
          700: '#006866',
          800: '#004544',
          900: '#002322',
        },
        charcoal: {
          DEFAULT: '#2D2D2D',
          light: '#4A4A4A',
          lighter: '#6B6B6B',
        }
      }
    }
  },
  plugins: []
} satisfies Config
