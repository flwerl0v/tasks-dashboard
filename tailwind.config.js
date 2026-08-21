import { palette } from './src/lib/colorPalette.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: palette.ink,
        surface: palette.surface,
        border: palette.border,
        primary: palette.primary,
        success: palette.success,
        warning: palette.warning,
        danger: palette.danger,
        accent: palette.accent,
      },
    },
  },
  plugins: [],
}
