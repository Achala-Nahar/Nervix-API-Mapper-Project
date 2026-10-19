/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      primary: '#3B82F6', 'primary-hover': '#2563EB', danger: '#EF4444', warning: '#F59E0B', success: '#10B981',
      'dark-bg': '#080D19', 'dark-card': '#111A2D', 'dark-card-2': '#1E293B', 'dark-border': '#334155',
      'text-primary': '#F8FAFC', 'text-secondary': '#CBD5E1', 'text-muted': '#7890B5'
    }
  } }, plugins: []
};
