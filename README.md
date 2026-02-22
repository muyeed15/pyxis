# Pyxis Search Engine

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

**Pyxis** is an open‑source, privacy‑respecting search engine developed by **PyxLab**. It provides fast, relevant search results across text, images, videos, news, and books by aggregating data from DuckDuckGo and enriching it with instant answers and autocomplete suggestions. The project consists of a **Next.js frontend** (App Router) and a **Flask backend** with Redis caching, designed for easy self‑hosting on Linux servers.

---

## Features

- **Multi‑type search** – Text, images, videos, news, and books via the DuckDuckGo API (using the `ddgs` library).
- **Instant answers** – Concise factual answers with optional related images (from Wikipedia/Wikimedia Commons).
- **Autocomplete** – Real‑time query suggestions powered by a local CSV‑based engine (enriched with English word frequency data from the Google Web Trillion Word Corpus).
- **Privacy first** – No user tracking; all requests are proxied and served with safe search enabled by default.
- **Fast & scalable** – Redis caching reduces latency and external API calls; PM2 ensures high availability in production.
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

- **Linux** (Debian 11/12 or Ubuntu 20.04+ recommended) or macOS (development only)
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

### 1. Navigate to the backend directory

```bash
cd backend/python
```

### 2. Set up a Python environment

It is strongly recommended to use a virtual environment or Conda.

**Using Conda**:

```bash
conda create -n pyxis python=3.10
conda activate pyxis
```

**Using venv**:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

If you do not have a `requirements.txt` file, manually install the core packages:

```bash
pip install ddgs flask flask-caching flask-cors python-dotenv waitress requests redis
```

> **Note:** The `ddgs` library is a DuckDuckGo Search wrapper. Ensure you have the latest version. The `redis` package is **required** for Redis caching support; without it you will get a `ModuleNotFoundError: No module named 'redis'`.

### 4. Install and configure Redis

Redis is used for caching. Install it via your package manager:

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Verify that Redis is running:

```bash
redis-cli ping
# Should return PONG
```

### 5. Configure environment variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` to set your Redis URL (if different from default):

```
REDIS_URL=redis://localhost:6379/0
```

### 6. Prepare autocomplete dataset

The autocomplete engine requires three CSV files inside the `autocomplete/dataset/` directory:

- `entities.csv` – columns: `category`, `entity`
- `keywords.csv` – one keyword per row
- `patterns.csv` – columns: `type`, `pattern`

Place these files in `autocomplete/dataset/` before starting the server.

### 7. Run the backend

#### Development Mode

For local testing with automatic reloading:

```bash
python app.py
```

The server will start at `http://0.0.0.0:5000`.

#### Production Mode with Waitress

Install Waitress if not already present:

```bash
pip install waitress
```

Run with:

```bash
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

#### Production Mode with PM2 (Recommended)

PM2 ensures the process stays alive and restarts on failure.

Install PM2 (requires Node.js):

```bash
sudo npm install -g pm2
```

Start the application using the provided ecosystem configuration:

```bash
pm2 start ecosystem.config.js
```

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs pyxis-flask-backend
```

Save the PM2 process list so it restarts on system reboot:

```bash
pm2 save
pm2 startup
```

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

1. **Install PM2 globally** (if not already done):

   ```bash
   sudo npm install -g pm2
   ```

2. **Start the backend** using the provided ecosystem file:

   ```bash
   cd backend/python
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
   cd frontend/client
   npm run build
   ```

2. **Start the frontend** with PM2 (create an `ecosystem.config.js` in the frontend directory or use a generic start command). Example configuration:

   ```javascript
   module.exports = {
     apps: [
       {
         name: "pyxis-frontend",
         script: "node_modules/.bin/next",
         args: "start",
         cwd: "/path/to/frontend/client",
         env: {
           NODE_ENV: "production",
           PORT: 3000,
         },
       },
     ],
   };
   ```

   Then start:

   ```bash
   pm2 start ecosystem.config.js
   ```

3. **Verify both processes are running**:

   ```bash
   pm2 status
   ```

---

## API Documentation

All endpoints return JSON. Below are the main routes.

### `GET /`

Root – returns basic API info.

### `GET /help`

Detailed endpoint documentation with examples and status of optional modules.

### `GET /search`

Performs a search of the specified type.

| Parameter                                                               | Description                                                      | Example          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------- |
| `q`                                                                     | Search query (URL‑encoded)                                       | `q=python`       |
| `type`                                                                  | `text`, `images`, `videos`, `news`, `books` (default `text`)     | `type=images`    |
| `region`                                                                | Region code, e.g. `us-en`, `de-de` (default `us-en`)             | `region=us-en`   |
| `timelimit`                                                             | Time restriction: `d` (day), `w` (week), `m` (month), `y` (year) | `timelimit=m`    |
| `page`                                                                  | Page number (1‑based, defaults to 1)                             | `page=2`         |
| `max_results`                                                           | Results per page (default depends on type)                       | `max_results=20` |
| Additional filters for images/videos: `size`, `color`, `duration`, etc. |                                                                  |                  |

**Example:**

```
/search?q=artificial+intelligence&type=text&page=1
```

### `GET /autocomplete`

Returns query autocomplete suggestions.

| Parameter     | Description                                | Example         |
| ------------- | ------------------------------------------ | --------------- |
| `q`           | Partial query (URL‑encoded)                | `q=how+to`      |
| `max_results` | Maximum number of suggestions (default 10) | `max_results=5` |

**Example:**

```
/autocomplete?q=how+to&max_results=5
```

### `GET /instant`

Fetches an instant answer and a related safe image.

| Parameter | Description         | Example       |
| --------- | ------------------- | ------------- |
| `q`       | Query (URL‑encoded) | `q=elon+musk` |

**Example:**

```
/instant?q=elon+musk
```

---

## Troubleshooting (Backend)

- **Redis connection errors**: Ensure Redis is running (`redis-cli ping`) and the `REDIS_URL` in `.env` is correct. Also verify that the Python `redis` package is installed.
- **Autocomplete not available**: Check that the CSV files exist in `autocomplete/dataset/` and have the correct format.
- **ModuleNotFoundError: No module named 'redis'**: Install the missing package with `pip install redis`.
- **PM2 not starting**: Run `pm2 logs pyxis-flask-backend` to see error details.

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
