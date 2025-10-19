module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        light: '#f9fafb',
        text: '#1f2937'
      },
      screens: {
        xs: "480px",
        "3xl": "1800px",
      }
    }
  },
  plugins: []
};
