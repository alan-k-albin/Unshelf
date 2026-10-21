module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B2A4A',
        accent: '#27AE60',
        light: '#F8FAFC',
        cream: '#FBF8F1',
        'cream-dark': '#F1E8D8',
        'warm-border': '#EDE6D6',
        'brick-red': '#B23A2E',
        'action-green': '#27AE60',
        'action-green-dark': '#1F9550',
      },
      fontFamily: {
        display: ["'Fraunces'", 'Georgia', 'serif'],
        body: ["'Inter'", '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
