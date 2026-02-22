/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GitHub-like color scheme
        'sidebar-bg': '#1a2128',
        'sidebar-hover': '#2c313a',
        'main-bg': '#ffffff',
        'border': '#d0d7de',
        'text-primary': '#24292f',
        'text-secondary': '#656d76',
        'text-muted': '#8b949e',
        'accent-blue': '#0969da',
        'accent-blue-hover': '#0860ca',
        'accent-green': '#1a7f37',
        'accent-orange': '#fb8500',
        'private-badge': '#f6f8fa',
        'breadcrumb': '#57606a',
        'commit-hash': '#4c5058',
        'file-hover': '#f6f8fa',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SFMono-Regular"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
