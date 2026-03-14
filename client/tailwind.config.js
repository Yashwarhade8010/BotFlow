/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark:    '#0A0F0D',
        dark2:   '#111916',
        dark3:   '#1A2420',
        card:    '#131C18',
        green:   '#00D46A',
        'green-dim': '#00a853',
        border:  '#1E2D27',
        border2: '#2A3F37',
        muted:   '#3A5548',
        muted2:  '#6B8C80',
        text:    '#C8DDD6',
        white:   '#F0FAF5',
        red:     '#FF4D4D',
        yellow:  '#FFB400',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm:   ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
