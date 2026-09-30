import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        positive: '#00c853',
        negative: '#ff1744',
        chartdark: '#333333',
        chartgray: '#cccccc',
        chartavg: '#999999',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
