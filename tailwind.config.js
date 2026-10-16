/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neuro: {
          bg: '#080B12',
          panel: '#101522',
          panelDark: '#0D111A',
          panelLight: '#151C2B',
          panelHover: '#1B2337',
          border: '#1E293B',
          borderLight: '#2A374F',
          borderGlow: 'rgba(0, 242, 254, 0.25)',
          cyan: '#00F2FE',
          cyanDim: '#06B6D4',
          violet: '#8B5CF6',
          amber: '#F59E0B',
          textMuted: '#94A3B8',
          textDim: '#64748B',
        },
        tumour: {
          wt: '#06B6D4', // Whole Tumour (NCR + ED + ET) - Cyan
          tc: '#8B5CF6', // Tumour Core (NCR + ET) - Violet
          et: '#F59E0B', // Enhancing Tumour - Amber
          ed: '#10B981', // Edema - Emerald
          ncr: '#EC4899', // Necrotic Core - Pink
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
