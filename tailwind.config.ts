import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './examples/**/*.{html,ts}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
