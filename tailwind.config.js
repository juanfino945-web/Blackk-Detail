/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#15171A',
        steel: '#8B8D91',
        dark: '#101214'
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
