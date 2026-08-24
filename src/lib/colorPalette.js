/**
 * Single source of truth for the app's semantic color tokens.
 * Consumed directly by tailwind.config.js (Node ESM) and re-exported
 * with app-facing helpers from ./colors.ts for use in TSX/recharts.
 */
export const palette = {
  ink: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1',
    200: '#e2e8f0',
  },
  surface: {
    DEFAULT: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
  },
  border: {
    DEFAULT: '#e2e8f0',
    100: '#f1f5f9',
    50: '#f8fafc',
    300: '#cbd5e1',
  },
  primary: {
    DEFAULT: '#2563eb',
    50: '#eff6ff',
    100: '#dbeafe',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  success: {
    DEFAULT: '#10b981',
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    DEFAULT: '#f59e0b',
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  danger: {
    DEFAULT: '#f43f5e',
    50: '#fff1f2',
    100: '#ffe4e6',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
  },
  accent: {
    DEFAULT: '#7c3aed',
    50: '#f5f3ff',
    600: '#7c3aed',
  },
}
