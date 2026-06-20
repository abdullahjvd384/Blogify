import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Sora',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Primary brand — an editorial, reader-friendly green (Medium-feel).
        brand: {
          50: '#f1faf4',
          100: '#dcf3e3',
          200: '#bce6ca',
          300: '#8dd2a7',
          400: '#56b67e',
          500: '#2f9e63',
          600: '#1f8050',
          700: '#1a6642',
          800: '#175137',
          900: '#13432f',
          950: '#09261b',
        },
        // Secondary accent — a calm teal that pairs with the green for soft gradients.
        accent: {
          50: '#f0fdfa',
          100: '#cdfaf0',
          200: '#9bf2e1',
          300: '#64e3cf',
          400: '#34cbb8',
          500: '#15b09e',
          600: '#0c8d80',
          700: '#0e7068',
          800: '#115a54',
          900: '#124a46',
          950: '#042f2c',
        },
        // Warm neutral scale (overrides Tailwind's cool slate) for a "paper" feel —
        // warm off-whites and a soft near-black instead of harsh pure black.
        slate: {
          50: '#faf9f6',
          100: '#f3f1ec',
          200: '#e7e3da',
          300: '#d4cfc2',
          400: '#a8a193',
          500: '#7b7568',
          600: '#5c5749',
          700: '#46423a',
          800: '#2b2823',
          900: '#1c1a16',
          950: '#11100d',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(28 26 22 / 0.04), 0 1px 3px 0 rgb(28 26 22 / 0.06)',
        card: '0 2px 4px -1px rgb(28 26 22 / 0.05), 0 6px 16px -2px rgb(28 26 22 / 0.07)',
        lift: '0 10px 25px -5px rgb(31 128 80 / 0.16), 0 8px 10px -6px rgb(28 26 22 / 0.08)',
        glow: '0 0 0 1px rgb(31 128 80 / 0.18), 0 8px 24px -8px rgb(31 128 80 / 0.40)',
        ring: '0 0 0 4px rgb(47 158 99 / 0.14)',
      },
      backgroundImage: {
        'grid-light':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M0 .5H31.5V32' fill='none' stroke='%23e7e3da'/%3E%3C/svg%3E\")",
        'grid-dark':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M0 .5H31.5V32' fill='none' stroke='%232b2823'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.95)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(47 158 99 / 0.45)' },
          '100%': { boxShadow: '0 0 0 14px rgb(47 158 99 / 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-fast': 'fade-in-fast 0.2s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 16s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [typography],
};
