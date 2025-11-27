import type { Config } from 'tailwindcss';
import { nextui } from '@nextui-org/react';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sunny Yellow Color Scheme
        'sunny-yellow': '#FBCD2F',
        'pure-white': '#FFFFFF',
        'charcoal-gray': '#2B2B2B',
        'soft-warm-gray': '#F3F3F3',
        'deep-orange-yellow': '#F5A623',
        // Updated amber palette to match sunny yellow scheme
        amber: {
          50: '#FFFDF0',
          100: '#FFF9E0',
          200: '#FFF3C1',
          300: '#FFED9F',
          400: '#FBCD2F',  // sunny-yellow
          500: '#F9C41E',
          600: '#F5A623',  // deep-orange-yellow
          700: '#E89113',
          800: '#C77A0D',
          900: '#A66408',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [nextui({
    themes: {
      light: {
        colors: {
          background: '#FFFFFF',
          foreground: '#2B2B2B',
          primary: {
            DEFAULT: '#FBCD2F',
            foreground: '#2B2B2B',
          },
          secondary: {
            DEFAULT: '#F5A623',
            foreground: '#FFFFFF',
          },
        },
      },
    },
  })],
};

export default config;
