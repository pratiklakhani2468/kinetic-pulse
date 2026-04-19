import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './node_modules/@heroui/react/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#C8FF00',
          '50': '#f5ffe0',
          '100': '#e8ffb3',
          '200': '#d8ff80',
          '300': '#C8FF00',
          '400': '#b8e600',
          '600': '#9acc00',
        },
        primary: {
          DEFAULT: '#C8FF00',
          foreground: '#080808',
        },
      },
      fontFamily: {
        bebas: ['var(--font-bebas)', 'Bebas Neue', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
}

export default config
