/**
 * PostCSS Configuration File – Pyxis Frontend
 * 
 * This file configures PostCSS, a tool for transforming CSS with JavaScript plugins.
 * It is used by Next.js to process CSS files, including Tailwind CSS.
 * 
 * The configuration defines which PostCSS plugins should be applied.
 * 
 * @see https://nextjs.org/docs/advanced-features/customizing-postcss-config
 * @see https://tailwindcss.com/docs/installation#post-css
 */

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    /**
     * Tailwind CSS PostCSS plugin.
     * 
     * This plugin processes Tailwind directives like `@tailwind` and
     * generates the final CSS based on the Tailwind configuration.
     * The `{}` indicates default options.
     */
    '@tailwindcss/postcss': {},

    /**
     * Autoprefixer plugin.
     * 
     * Autoprefixes CSS rules with vendor-specific prefixes (e.g., `-webkit-`)
     * to ensure cross‑browser compatibility. It uses data from Can I Use.
     * The `{}` indicates default options.
     */
    autoprefixer: {},
  },
};

export default config;