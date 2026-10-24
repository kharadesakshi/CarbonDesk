/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1C1C',
        forest: '#1B4332',
        'forest-deep': '#012D1D',
        success: '#2D6A4F',
        canvas: '#FBF9F8',
        line: '#E5E7EB',
        muted: '#F8F9FA',
        warning: '#B45309',
        danger: '#DC2626'
      },
      fontFamily: { sans: ['Inter', 'Arial', 'sans-serif'] },
      boxShadow: { panel: '0 4px 12px rgba(30,41,59,.08)' }
    }
  },
  plugins: []
}
