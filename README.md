# Pyxis Search Engine

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

**Pyxis** is an open‑source, privacy‑respecting search engine developed by **PyxLab**. It provides fast, relevant search results across text, images, videos, news, and books by aggregating data from DuckDuckGo and enriching it with instant answers and autocomplete suggestions. The project consists of a **Next.js frontend** (App Router) and a **Flask backend** with Redis caching, designed for easy self‑hosting on Linux servers.

---

## Features

- **Multi‑type search** – Text, images, videos, news, and books via the DuckDuckGo API.
- **Instant answers** – Concise factual answers with optional related images (from Wikipedia/Wikimedia Commons).
- **Autocomplete** – Real‑time query suggestions powered by a local CSV‑based engine (enriched with English word frequency data).
- **Privacy first** – No user tracking; all requests are proxied and served with safe search enabled by default.
- **Fast & scalable** – Redis caching reduces latency; PM2 ensures high availability in production.
- **Modern frontend** – Responsive UI built with Next.js (App Router), TypeScript, and Tailwind CSS.
- **CORS‑ready** – Backend supports cross‑origin requests for seamless frontend integration.

---

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Next.js       │─────▶│   Flask API     │─────▶│   DuckDuckGo    │
│   Frontend      │ HTTP │   (Backend)     │ HTTP │   (External)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│   Browser       │      │   Redis Cache   │
│   (User)        │      │   (Optional)    │
└─────────────────┘      └─────────────────┘
```

- **Frontend** – Next.js application serving the user interface. All pages and components live inside the `app/` directory (App Router). In development, API calls are proxied to the backend via Next.js rewrites.
- **Backend** – Flask REST API that fetches search results from DuckDuckGo, provides autocomplete and instant answers, and caches responses in Redis.
- **Redis** – Optional but recommended for production; significantly improves response times and reduces load on external APIs.

---

## Getting Started

### Prerequisites

- **Linux** (Debian/Ubuntu recommended) or macOS (development only)
- **Node.js** 20 LTS or higher
- **Python** 3.10 or higher
- **Redis** (optional for development, required for production caching)
- **Git**

### Clone the Repository

```bash
git clone https://github.com/muyeed15/pyxis.git
cd pyxis
```

---

## Backend Setup

1. **Navigate to the backend directory**:

   ```bash
   cd backend/python
   ```

2. **Create and activate a Python virtual environment** (conda or venv):

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:

   ```bash
   pip install ddgs flask flask-caching flask-cors python-dotenv waitress requests
   ```

4. **Install and start Redis** (if not already running):

   ```bash
   sudo apt update && sudo apt install redis-server
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

5. **Configure environment variables**:

   ```bash
   cp env.example .env
   ```

   Edit `.env` to set the Redis URL (default is fine for local):

   ```
   REDIS_URL=redis://localhost:6379/0
   ```

6. **Prepare autocomplete datasets**:
   Place the required CSV files in `autocomplete/dataset/`:
   - `entities.csv` (columns: `category`, `entity`)
   - `keywords.csv` (one keyword per row)
   - `patterns.csv` (columns: `type`, `pattern`)

7. **Run the backend in development mode**:

   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5000`.

---

## Frontend Setup

1. **Navigate to the frontend client directory**:

   ```bash
   cd ../../frontend/client
   ```

2. **Install Node.js dependencies**:

   ```bash
   npm install
   # or yarn / pnpm
   ```

3. **Configure environment variables**:

   ```bash
   cp env.example .env.local
   ```

   Adjust the backend URL if needed (default points to `http://localhost:5000`):

   ```
   NEXT_PUBLIC_URL_BACKEND_API="http://localhost:5000"
   NEXT_PUBLIC_URL_FRONTEND="http://localhost:3000"
   ```

4. **Run the frontend development server**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

   > **Note:** In development, API requests to `/api/*` are proxied to the backend (see `next.config.ts`).

---

## Running in Production

### Backend (Flask) with PM2

1. **Install PM2 globally**:

   ```bash
   sudo npm install -g pm2
   ```

2. **Start the backend** using the provided ecosystem file:

   ```bash
   cd backend
   pm2 start ecosystem.config.js
   ```

3. **Save the PM2 process list** and enable startup:

   ```bash
   pm2 save
   pm2 startup
   ```

### Frontend (Next.js) with PM2

1. **Build the frontend**:

   ```bash
   cd frontend
   npm run build
   ```

2. **Start the frontend** with PM2:

   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Verify both processes are running**:

   ```bash
   pm2 status
   ```

---

## API Documentation (Summary)

The backend exposes the following main endpoints (all return JSON):

| Endpoint        | Method | Description                           | Example                      |
| --------------- | ------ | ------------------------------------- | ---------------------------- |
| `/`             | GET    | Basic API info                        | `/`                          |
| `/help`         | GET    | Detailed endpoint documentation       | `/help`                      |
| `/search`       | GET    | Perform a search (text, images, etc.) | `/search?q=python&type=text` |
| `/autocomplete` | GET    | Get query suggestions                 | `/autocomplete?q=how+to`     |
| `/instant`      | GET    | Fetch instant answer + image          | `/instant?q=elon+musk`       |

For full parameter details, see the [backend README](backend/README.md).

---

## Acknowledgments

Pyxis would not be possible without the following open-source projects and data resources:

- **[ddgs](https://github.com/deedy5/ddgs)** – A Python library that provides a clean interface to DuckDuckGo search. It powers all search endpoints (text, images, videos, news, books) in the backend.  
  Licensed under the MIT License. Copyright (c) 2024 deedy5.

- **English Word Frequency Dataset** – The autocomplete engine uses frequency information derived from the **Google Web Trillion Word Corpus**.
  - **Source**: [Google Web Trillion Word Corpus](https://catalog.ldc.upenn.edu/LDC2006T13) (Thorsten Brants and Alex Franz, distributed by the Linguistic Data Consortium).
  - **Derivation**: The word frequency list was processed and made available by **Peter Norvig**. You can find more details and the original code at [norvig.com/ngrams](https://norvig.com/ngrams/).
  - The data files are used under the terms described by Peter Norvig; the code to generate them is distributed under the MIT License.
  - This dataset provides the 333,333 most common English words and their relative frequencies, which helps improve the relevance of autocomplete suggestions.

We thank all contributors and maintainers of these projects for their valuable work.

---

## License

This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by PyxLab**
