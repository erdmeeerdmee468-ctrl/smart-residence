import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", // Замыг нь анхаараарай
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;