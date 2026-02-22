# Pyxis Search Frontend – Next.js Application

This directory contains the Next.js frontend for the Pyxis Search Engine. It provides a modern, responsive user interface for performing searches, viewing results (text, images, video), and accessing instant answers.

## Features

- **Search pages**: dedicated routes for text, image, and video results
- **Instant answer panel**: displays concise answers with optional images
- **Autocomplete** (via backend API)
- **Related searches** component
- **Sign‑in page** (placeholder for future authentication)
- **Tailwind CSS** for styling, with custom radial/conic gradients
- **API proxying** during development (rewrites to backend)

## Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Node.js**: Version 20 LTS or higher

## Getting Started

### Prerequisites

- Node.js **20 LTS** or newer (check with `node --version`)
- npm (comes with Node.js) or yarn/pnpm
- Backend API server running (see backend documentation) – default expects `http://localhost:5000`

### Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd frontend/client   # or wherever this directory is located
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   Copy the example environment file and adjust values if needed:

   ```bash
   cp env.example .env.local
   ```

   The default values point to a local backend on port 5000 and frontend on port 3000:

   ```
   NEXT_PUBLIC_URL_BACKEND_API="http://localhost:5000"
   NEXT_PUBLIC_URL_FRONTEND="http://localhost:3000"
   ```

   If your backend runs elsewhere, update `NEXT_PUBLIC_URL_BACKEND_API` accordingly.

### Running in Development

Start the development server with hot reload:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Note:** In development, API requests to `/api/*` are proxied to `http://localhost:5000` as defined in `next.config.ts`. Ensure your backend is running on that port.

### Building for Production

Create an optimized production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The output will be in the `.next` folder.

### Running the Production Server

After building, start the Next.js production server:

```bash
npm start
# or
yarn start
# or
pnpm start
```

By default, the server listens on port `3000`. You can change the port by setting the `PORT` environment variable:

```bash
PORT=4000 npm start
```

## Project Structure

```
.
├── components/               # Reusable UI components
│   ├── homesearchbar.tsx
│   ├── instantanswer.tsx
│   ├── relatedsearches.tsx
│   └── searchheader.tsx
├── search/                   # Search‑related pages (grouped by type)
│   ├── image/                # Image search results
│   │   ├── image-category-bar.tsx
│   │   ├── image.tsx
│   │   ├── page.tsx
│   │   └── pagewrapper.tsx
│   ├── text/                 # Text search results
│   │   ├── page.tsx
│   │   ├── pagewrapper.tsx
│   │   └── text.tsx
│   └── video/                # Video search results
│       ├── page.tsx
│       ├── pagewrapper.tsx
│       └── video.tsx
├── signin/                    # Sign‑in page (placeholder)
│   ├── page.tsx
│   └── signinwrapper.tsx
├── favicon.ico
├── globals.css                # Global styles (Tailwind imports)
├── layout.tsx                 # Root layout
├── page.tsx                   # Homepage
├── providers.tsx              # Context providers (if any)
├── types.ts                   # Shared TypeScript types
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.mjs         # PostCSS configuration
├── env.example                # Example environment variables
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Scripts

| Script        | Description                                      |
|---------------|--------------------------------------------------|
| `npm run dev` | Start development server with hot reload         |
| `npm run build`| Create production build                          |
| `npm start`   | Run production server (after build)              |
| `npm run lint`| Run ESLint (if configured)                       |

## Environment Variables

| Variable                     | Description                                      | Default               |
|------------------------------|--------------------------------------------------|-----------------------|
| `NEXT_PUBLIC_URL_BACKEND_API`| Public URL of the backend API (used by frontend) | `http://localhost:5000`|
| `NEXT_PUBLIC_URL_FRONTEND`   | Public URL of the frontend itself (for meta tags)| `http://localhost:3000`|

Variables prefixed with `NEXT_PUBLIC_` are embedded in the browser bundle. Changes require a rebuild.

## Production Deployment with PM2

For production, you can use PM2 to keep the Next.js server running.

1. **Install PM2 globally** (if not already):

   ```bash
   npm install -g pm2
   ```

2. **Use the provided ecosystem configuration** (`ecosystem.config.js` in the parent directory) or create your own:

   ```javascript
   module.exports = {
     apps: [{
       name: 'pyxis-next-frontend',
       cwd: '/path/to/frontend/client',
       script: 'node_modules/.bin/next',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   ```

3. **Start the process**:

   ```bash
   pm2 start ecosystem.config.js
   ```

4. **Enable startup on reboot**:

   ```bash
   pm2 save
   pm2 startup
   ```

## Troubleshooting

- **Backend connection refused**: Ensure the backend API is running and `NEXT_PUBLIC_URL_BACKEND_API` points to the correct URL.
- **Images not loading**: The Next.js image configuration allows all HTTPS domains. If images are from HTTP sources, they will not be optimised. Consider updating `remotePatterns` if needed.
- **Development origin errors**: If accessing from a custom domain like `search.pyx-lab.org`, add it to `allowedDevOrigins` in `next.config.ts`.
- **Port already in use**: Use `PORT=3001 npm run dev` to change the port.

