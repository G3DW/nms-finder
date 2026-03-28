/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        void: '#09090f',
        teal: '#00e5cc',
        panel: 'rgba(10, 15, 24, 0.8)',
      },
      boxShadow: {
        teal: '0 0 24px rgba(0, 229, 204, 0.18)',
      },
      backgroundImage: {
        stars:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0 1px, transparent 1px), radial-gradient(circle at 80% 30%, rgba(0,229,204,0.12) 0 1px, transparent 1px), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.12) 0 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
