import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        'golden-orange': '#FFB347',
        'deep-amber': '#D4AF37',
        'chocolate-brown': '#8B5A2B',
      },
      backgroundImage: {
        'mesh-gradient': 'linear-gradient(135deg, rgba(255, 179, 71, 0.1) 0%, rgba(212, 175, 55, 0.1) 50%, rgba(139, 90, 43, 0.1) 100%)',
      },
      boxShadow: {
        'xl-golden': '0 20px 25px -5px rgba(212, 175, 55, 0.3), 0 10px 10px -5px rgba(255, 179, 71, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 179, 71, 0.8), 0 0 30px rgba(212, 175, 55, 0.6)' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: "#D4AF37",
            foreground: "#000000",
          },
          secondary: {
            DEFAULT: "#FFB347",
            foreground: "#000000",
          },
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: "#D4AF37",
            foreground: "#000000",
          },
          secondary: {
            DEFAULT: "#FFB347",
            foreground: "#000000",
          },
        },
      },
    },
  })],
}

module.exports = config;
