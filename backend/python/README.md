# Pyxis Search Engine Backend

This is the backend for the Pyxis Search Engine, a Flask-based API that provides search functionality via DuckDuckGo, autocomplete suggestions, and instant answers. It is designed to run on Linux servers (Debian/Ubuntu) with Python 3.10+.

## Features

- **Search endpoints**: text, images, videos, news, books (via `ddgs` library)
- **Autocomplete suggestions** (local CSV‑based engine)
- **Instant answers** with optional related image (DuckDuckGo + Wikipedia/Commons fallback)
- **Redis caching** to reduce latency and external API calls
- **PM2 process management** for production
- **CORS enabled** for frontend integration

## Requirements

- Linux (Debian 11/12 or Ubuntu 20.04+ recommended)
- Python 3.10 or higher
- Redis server (local or remote)
- Miniconda (optional but recommended for environment management)
- PM2 (Node.js process manager) – for production

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/pyxis-backend.git
cd pyxis-backend/python
```

### 2. Set up a Python environment

It is strongly recommended to use a virtual environment or Conda.

#### Using Conda

```bash
conda create -n pyxis python=3.10
conda activate pyxis
```

#### Using venv

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
pip install ddgs flask flask-caching flask-cors python-dotenv waitress requests
```

> **Note:** The `ddgs` library is a DuckDuckGo Search wrapper. Ensure you have the latest version.

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

## Running the Application

### Development Mode

For local testing with automatic reloading:

```bash
python app.py
```

The server will start at `http://0.0.0.0:5000`.

### Production Mode with Waitress

Install Waitress if not already present:

```bash
pip install waitress
```

Run with:

```bash
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

### Production Mode with PM2 (Recommended)

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

## API Endpoints

All endpoints return JSON. Below are the main routes.

### `GET /`

Root – returns basic API info.

### `GET /help`

Detailed endpoint documentation with examples and status of optional modules.

### `GET /search`

Performs a search of the specified type.

| Parameter     | Description                                                                 | Example                |
|---------------|-----------------------------------------------------------------------------|------------------------|
| `q`           | Search query (URL‑encoded)                                                  | `q=python`             |
| `type`        | `text`, `images`, `videos`, `news`, `books` (default `text`)                | `type=images`          |
| `region`      | Region code, e.g. `us-en`, `de-de` (default `us-en`)                        | `region=us-en`         |
| `timelimit`   | Time restriction: `d` (day), `w` (week), `m` (month), `y` (year)            | `timelimit=m`          |
| `page`        | Page number (1‑based, defaults to 1)                                        | `page=2`               |
| `max_results` | Results per page (default depends on type)                                  | `max_results=20`       |
| Additional filters for images/videos: `size`, `color`, `duration`, etc.      |                        |

**Example:**

```
/search?q=artificial+intelligence&type=text&page=1
```

### `GET /autocomplete`

Returns query autocomplete suggestions.

| Parameter     | Description                             | Example               |
|---------------|-----------------------------------------|-----------------------|
| `q`           | Partial query (URL‑encoded)             | `q=how+to`            |
| `max_results` | Maximum number of suggestions (default 10) | `max_results=5`    |

**Example:**

```
/autocomplete?q=how+to&max_results=5
```

### `GET /instant`

Fetches an instant answer and a related safe image.

| Parameter     | Description                             | Example               |
|---------------|-----------------------------------------|-----------------------|
| `q`           | Query (URL‑encoded)                     | `q=elon+musk`         |

**Example:**

```
/instant?q=elon+musk
```

## Project Structure

```
python/
├── app.py                     # Main Flask application
├── autocomplete/               # Autocomplete module
│   ├── autocomplete.py
│   └── dataset/                # CSV files
├── instantsearch/              # Instant answer module
│   └── instantsearch.py
├── ecosystem.config.js         # PM2 configuration
├── env.example                 # Example environment file
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## Troubleshooting

- **Redis connection errors**: Ensure Redis is running and the `REDIS_URL` in `.env` is correct.
- **Autocomplete not available**: Check that the CSV files exist in `autocomplete/dataset/` and have the correct format.
- **ModuleNotFoundError**: Verify that you are in the correct Python environment and all dependencies are installed.
- **PM2 not starting**: Run `pm2 logs pyxis-flask-backend` to see error details.
