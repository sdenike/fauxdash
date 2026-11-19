/** @type {import('tailwindcss').Config} */

// Tokens in src/app/globals.css are complete oklch colours (Bear "Red Graphite"), so they are not
// wrapped in hsl(). color-mix keeps opacity modifiers working: bg-brand/20, border-border/60.
// Mix in oklab, never oklch: the build rewrites the tokens to lab(), and Chrome treats a near-grey colour
// converted to oklch as having no hue, then takes the hue from `transparent` (0, red). Every graphite
// surface came out warm grey (#1c1819) instead of blue grey (#171a1c). oklab has no hue channel.
const token = (name) =>
  `color-mix(in oklab, var(--${name}) calc(<alpha-value> * 100%), transparent)`

const tone = (name) => ({
  DEFAULT: token(name),
  foreground: token(`${name}-foreground`),
  soft: token(`${name}-soft`),
})

module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        accent: { DEFAULT: token('accent'), foreground: token('accent-foreground') },
        popover: { DEFAULT: token('popover'), foreground: token('popover-foreground') },
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        brand: tone('brand'),
        destructive: tone('destructive'),
        success: tone('success'),
        warning: tone('warning'),
        info: tone('info'),
        chart: {
          1: token('chart-1'),
          2: token('chart-2'),
          3: token('chart-3'),
          4: token('chart-4'),
          5: token('chart-5'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  // iOS keeps :hover "stuck" after a tap; only apply hover styles where a real pointer can hover.
  future: { hoverOnlyWhenSupported: true },
  plugins: [
    require('tailwindcss-animate'),
    // coarse: touch screens (44px targets). standalone: launched from the iOS/Android home screen.
    function ({ addVariant }) {
      addVariant('coarse', '@media (pointer: coarse)')
      addVariant('standalone', '@media (display-mode: standalone)')
    },
  ],
}
