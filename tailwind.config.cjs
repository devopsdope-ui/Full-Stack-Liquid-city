module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FDFDF8',
          100: '#F9F8EF',
          200: '#F5F5DC',
          300: '#EEEAD0',
          400: '#E5DFB5',
          500: '#D4C987',
          600: '#B8A84A',
          700: '#8F7E2A',
          800: '#5C5118',
          900: '#30290A',
        },
        city: {
          black: '#000000',
          charcoal: '#1A1A1A',
          dark: '#2D2D2D',
          gray: '#6B6B6B',
          muted: '#9B9B9B',
          border: '#E5E0CC',
          card: '#FAFAF5',
          surface: '#FFFFFF',
        },
        status: {
          available: '#22C55E',
          moderate: '#F59E0B',
          crowded: '#EF4444',
          normal: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        panel: '0 4px 12px 0 rgba(0,0,0,0.08)',
        modal: '0 20px 60px 0 rgba(0,0,0,0.15)',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
