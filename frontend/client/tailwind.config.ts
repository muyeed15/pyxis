/**
 * Tailwind CSS Configuration File – Pyxis Frontend
 * 
 * This file configures Tailwind CSS for the Pyxis frontend application.
 * It defines content sources (where Tailwind should look for class names),
 * disables dark mode, and extends the default theme with custom gradients.
 * 
 * @see https://tailwindcss.com/docs/configuration
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  /**
   * Disable dark mode entirely.
   * 
   * Setting `darkMode` to `false` means Tailwind will not generate
   * dark mode variants (`dark:` prefix). The application will use
   * only the light theme.
   */
  darkMode: false,

  /**
   * `content` specifies the files Tailwind should scan to generate
   * the appropriate CSS classes. Only classes found in these files
   * will be included in the final bundle (purge behaviour).
   * 
   * Paths are relative to the project root.
   */
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  /**
   * Theme customisation.
   * 
   * `extend` allows adding new values to the default Tailwind theme
   * without overriding existing ones.
   */
  theme: {
    extend: {
      /**
       * Custom background image utilities.
       * 
       * `gradient-radial` and `gradient-conic` can be used with
       * `bg-gradient-radial` or `bg-gradient-conic` classes.
       * They provide radial and conic gradient effects.
       */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },

  /**
   * No additional plugins are used.
   */
  plugins: [],
};

export default config;