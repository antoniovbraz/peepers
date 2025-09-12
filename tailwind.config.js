/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Peepers Brand Colors (Crowned Frog Theme)
        primary: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bce5bc',
          300: '#8dd18d',
          400: '#5cb85c',
          500: '#2d5a27', // Main brand green
          600: '#254d22',
          700: '#1f4a1f',
          800: '#1a3d1a',
          900: '#163316',
        },
        peepers: {
          neutral: {
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            900: '#111827'
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}