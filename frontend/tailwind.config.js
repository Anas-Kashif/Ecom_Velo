/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "surface-variant": "#e1e3e4",
        "surface-tint": "#c00014",
        "on-secondary-fixed": "#1a1c1e",
        "surface-container-low": "#f3f4f5",
        "on-secondary": "#ffffff",
        "on-error-container": "#93000a",
        "outline": "#926f6b",
        "surface-container-highest": "#e1e3e4",
        "surface-container-high": "#e7e8e9",
        "inverse-on-surface": "#f0f1f2",
        "surface": "#f8f9fa",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f8f9fa",
        "on-secondary-container": "#636467",
        "tertiary": "#006190",
        "on-tertiary-container": "#fbfcff",
        "inverse-surface": "#2e3132",
        "tertiary-fixed": "#cbe6ff",
        "on-tertiary-fixed": "#001e30",
        "on-primary-fixed-variant": "#93000d",
        "primary-fixed-dim": "#ffb4ab",
        "primary-container": "#e31e24",
        "error": "#ba1a1a",
        "tertiary-container": "#007bb5",
        "secondary": "#5d5e61",
        "on-secondary-fixed-variant": "#454749",
        "surface-container-lowest": "#ffffff",
        "inverse-primary": "#ffb4ab",
        "secondary-fixed": "#e2e2e5",
        "on-tertiary-fixed-variant": "#004b71",
        "on-surface-variant": "#5d3f3c",
        "outline-variant": "#e7bdb8",
        "on-primary": "#ffffff",
        "on-error": "#ffffff",
        "surface-container": "#edeeef",
        "primary": "#ba0013",
        "background": "#f8f9fa",
        "on-primary-container": "#fffafa",
        "secondary-container": "#e2e2e5",
        "on-background": "#191c1d",
        "secondary-fixed-dim": "#c6c6c9",
        "primary-fixed": "#ffdad6",
        "tertiary-fixed-dim": "#8ecdff",
        "on-surface": "#191c1d",
        "on-primary-fixed": "#410002"
      },
      fontFamily: {
        "headline": ["'Space Grotesk'", 'sans-serif'],
        "body": ["'Inter'", 'sans-serif'],
        "label": ["'Space Grotesk'", 'sans-serif']
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
    },
  },
  plugins: [
    // require('@tailwindcss/forms'),  // Optional: uncomment if installed
  ],
};
