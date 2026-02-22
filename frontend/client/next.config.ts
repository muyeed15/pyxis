/**
 * Next.js Configuration File – Pyxis Frontend
 * 
 * This file configures the Next.js application for the Pyxis search frontend.
 * It defines rewrites for API proxying, allowed development origins,
 * and image remote patterns to enable loading images from any HTTPS source.
 * 
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Rewrites allow you to map an incoming request path to a different
   * destination URL (internal or external).
   * 
   * Here, any request to `/api/*` is proxied to the backend Flask server
   * running on `http://localhost:5000`. This avoids CORS issues during
   * development and keeps the backend URL hidden from the client.
   * 
   * In production, this rewrite should point to the actual backend URL,
   * or you may prefer to use environment variables.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*',
      },
    ];
  },

  /**
   * `allowedDevOrigins` specifies which origins are permitted to access
   * the development server. This is useful when testing on devices or
   * from custom domain names (like `search.pyx-lab.org`) during development.
   * 
   * If not set, Next.js only allows localhost by default.
   */
  allowedDevOrigins: ['search.pyx-lab.org'],

  /**
   * Configuration for the Next.js built‑in image optimization.
   * 
   * `remotePatterns` defines which external image sources are allowed
   * to be optimized. The pattern `{ protocol: 'https', hostname: '**' }`
   * permits images from any HTTPS domain. This is necessary because
   * search results may contain images from arbitrary sources.
   * 
   * In production, you might want to restrict this to specific domains
   * for security or performance reasons.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow any HTTPS hostname
      },
    ],
  },
};

export default nextConfig;