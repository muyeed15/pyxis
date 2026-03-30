"""
Pyxis Search API – Flask application providing search endpoints using DuckDuckGo Search,
with autocomplete suggestions and instant answers.

This module initialises a Flask app with CORS support and Redis caching.
It exposes endpoints for:
    - Text, image, video, news, and book searches 
    - Query autocompletion (using a local autocomplete engine)
    - Instant answers with optional image (using DuckDuckGo Instant Answer API + image fallback)

All endpoints support caching (Redis) to reduce latency and external API calls.
Cache keys are built from sorted query parameters to ensure parameter-order-independent
cache hits (e.g. ``?q=car&type=images`` and ``?type=images&q=car`` resolve to the same key).

SafeSearch policy: adult content is always filtered. The ``safesearch`` parameter is
hard-coded to ``"on"`` for every search type and cannot be overridden by callers.
"""

from flask import Flask, jsonify, request
from flask_caching import Cache
from ddgs import DDGS
import csv
import os
import time
import tldextract
import urllib.parse
import requests  # <-- Added for the Open Library Books API
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file (e.g., REDIS_URL)
load_dotenv()

# ----------------------------------------------------------------------
# SafeSearch policy – ALWAYS ON, never caller-overridable
# ----------------------------------------------------------------------
SAFE_SEARCH = "on"

# ----------------------------------------------------------------------
# Adult content filtering – loaded from CSV files
# ----------------------------------------------------------------------
_FILTER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "filters")
_KEYWORDS_CSV = os.path.join(_FILTER_DIR, "blocked_keywords.csv")
_DOMAINS_CSV  = os.path.join(_FILTER_DIR, "blocked_domains.csv")


def _load_csv_set(path: str) -> set[str]:
    """
    Load a single-column CSV file into a set of lowercase stripped strings.
    The first row is treated as a header and skipped.
    Returns an empty set if the file is missing or unreadable.
    """
    result: set[str] = set()
    try:
        with open(path, newline="", encoding="utf-8") as fh:
            reader = csv.reader(fh)
            next(reader, None)  # skip header
            for row in reader:
                if not row:
                    continue
                value = row[0].strip().lower()
                if value:
                    result.add(value)
    except FileNotFoundError:
        print(f"[FILTER] CSV not found, skipping: {path}")
    except Exception as e:
        print(f"[FILTER] Failed to load {path}: {e}")
    return result


# Load filter lists at startup – reload by restarting the server.
BLOCKED_QUERY_KEYWORDS: set[str] = _load_csv_set(_KEYWORDS_CSV)
BLOCKED_DOMAINS: set[str]        = _load_csv_set(_DOMAINS_CSV)


def is_query_blocked(query: str) -> bool:
    """Return True if the query contains any blocked keyword."""
    q = query.lower()
    return any(kw in q for kw in BLOCKED_QUERY_KEYWORDS)


def _extract_base_domain(url: str) -> str:
    """
    Extract just the registered domain name (no TLD, no subdomain) from a URL
    using tldextract, so that xvideos.com / xvideos.es / xvideos.red all
    resolve to the same base name 'xvideos' for blocklist matching.
    """
    try:
        return tldextract.extract(url).domain.lower()
    except Exception:
        return ""


def _build_haystack(r: dict) -> str:
    """
    Flatten every possible field of a result — including deeply nested
    values — into a single lowercased string for keyword scanning.
    Uses recursive extraction so no nested field is ever missed.
    """
    def _extract(obj) -> list[str]:
        if isinstance(obj, str):
            return [obj]
        if isinstance(obj, dict):
            return [s for v in obj.values() for s in _extract(v)]
        if isinstance(obj, (list, tuple)):
            return [s for v in obj for s in _extract(v)]
        return [str(obj)] if obj is not None else []

    return " ".join(_extract(r)).lower()


def _result_is_clean(r: dict) -> bool:
    """
    Return True only if the result passes ALL checks:
      1. Its extracted base domain is not in BLOCKED_DOMAINS.
      2. No blocked domain name appears anywhere in the raw URL string
         (catches paths like /bestialitysextaboo.net/...).
      3. No blocked keyword appears anywhere in any field — including
         as a substring, so 'sexy' is caught by 'sex', 'bestiality'
         is caught by 'bestial', etc.
    One match anywhere = result dropped.
    """
    raw_url = (r.get("href") or r.get("url") or r.get("content") or "").lower()

    # Check 1: extracted base domain
    if _extract_base_domain(raw_url) in BLOCKED_DOMAINS:
        return False

    # Check 2: any blocked domain name present anywhere in the raw URL
    if any(bd in raw_url for bd in BLOCKED_DOMAINS):
        return False

    # Check 3: keyword substring scan across all fields
    haystack = _build_haystack(r)
    if any(kw in haystack for kw in BLOCKED_QUERY_KEYWORDS):
        return False

    return True


def filter_results(results: list[dict]) -> list[dict]:
    """Return only results that pass every content check."""
    return [r for r in results if _result_is_clean(r)]

# ----------------------------------------------------------------------
# Cache configuration
# ----------------------------------------------------------------------
cache = Cache(config={
    'CACHE_TYPE': 'RedisCache',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'pyxis_'
})

# ----------------------------------------------------------------------
# Autocomplete module import (optional)
# ----------------------------------------------------------------------
try:
    from autocomplete.autocomplete import Autocomplete
    current_dir = os.path.dirname(os.path.abspath(__file__))
    autocomplete_data_dir = os.path.join(current_dir, "autocomplete", "dataset")
    autocomplete = Autocomplete(
        entities_csv=os.path.join(autocomplete_data_dir, "entities.csv"),
        keywords_csv=os.path.join(autocomplete_data_dir, "keywords.csv"),
        patterns_csv=os.path.join(autocomplete_data_dir, "patterns.csv"),
    )
    AUTOCOMPLETE_AVAILABLE = True
except Exception as e:
    print(f"Autocomplete failed: {e}")
    AUTOCOMPLETE_AVAILABLE = False

# ----------------------------------------------------------------------
# Instant answer client import (optional)
# ----------------------------------------------------------------------
try:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from instantsearch.instantsearch import InstantAnswerClient
    INSTANT_ANSWER_AVAILABLE = True
except Exception as e:
    print(f"Instant answer client import failed: {e}")
    INSTANT_ANSWER_AVAILABLE = False

# ----------------------------------------------------------------------
# Flask app initialisation
# ----------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.json.ensure_ascii = False
cache.init_app(app)

# ----------------------------------------------------------------------
# Constants for retry logic, pagination limits, and cache TTLs
# ----------------------------------------------------------------------
MAX_RETRIES = 5
RETRY_DELAYS = [0.1, 0.2, 0.4, 0.8]

TEXT_MAX_RESULTS_PER_PAGE = 10
TEXT_MAX_PAGES = 10

IMAGE_MAX_RESULTS_PER_PAGE = 20
IMAGE_MAX_PAGES = 10

VIDEO_MAX_RESULTS_PER_PAGE = 20
VIDEO_MAX_PAGES = 10

NEWS_MAX_RESULTS_PER_PAGE = 10
NEWS_MAX_PAGES = 10

BOOKS_MAX_RESULTS_PER_PAGE = 10
BOOKS_MAX_PAGES = 10

CACHE_TIMEOUT_TEXT = 604800       # 1 week
CACHE_TIMEOUT_IMAGE = 259200      # 3 days
CACHE_TIMEOUT_VIDEO = 86400       # 1 day
CACHE_TIMEOUT_NEWS = 3600         # 1 hour
CACHE_TIMEOUT_BOOKS = 1296000     # 15 days
CACHE_TIMEOUT_AUTOCOMPLETE = 2592000  # 30 days
CACHE_TIMEOUT_INSTANT = 2592000   # 30 days


def ddgs_with_retry(fn):
    """
    Execute a DuckDuckGo search function with automatic retries using exponential backoff.
    """
    last_exc = None
    for attempt in range(MAX_RETRIES):
        try:
            return fn(DDGS())
        except Exception as e:
            last_exc = e
            print(f"[DDGS] attempt {attempt + 1}/{MAX_RETRIES}: {type(e).__name__}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAYS[attempt])
    raise last_exc


def make_cache_key(*args, **kwargs):
    """
    Generate a normalised, order-independent cache key for the current request.
    """
    params = sorted(
        (k, v) for k, v in request.args.items() if k != "safesearch"
    )
    sorted_qs = urllib.parse.urlencode(params)
    return f"{request.path}?{sorted_qs}"


# ----------------------------------------------------------------------
# API endpoints
# ----------------------------------------------------------------------
@app.route("/autocomplete", methods=["GET"])
def autocomplete_suggestions():
    cache_key = make_cache_key()
    cached = cache.get(cache_key)
    if cached is not None:
        return jsonify(cached)

    if not AUTOCOMPLETE_AVAILABLE:
        return jsonify({"error": "Autocomplete not available"}), 503

    raw_query = request.args.get("q", "").strip()
    if not raw_query:
        return jsonify({"error": "Missing parameter: q"}), 400

    try:
        max_results = request.args.get("max_results", 10, type=int)
        query = urllib.parse.unquote(raw_query)
        suggestions = autocomplete.generate_suggestions(query, max_results=max_results)
        response_data = {"query": query, "suggestions": suggestions, "count": len(suggestions)}
        cache.set(cache_key, response_data, timeout=CACHE_TIMEOUT_AUTOCOMPLETE)
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/search", methods=["GET"])
def search():
    cache_key = make_cache_key()
    cached = cache.get(cache_key)
    if cached is not None:
        return jsonify(cached)

    raw_keywords = request.args.get("q")
    if not raw_keywords:
        return jsonify({"error": "Missing parameter: q"}), 400

    keywords = urllib.parse.unquote(raw_keywords)

    if is_query_blocked(keywords):
        return jsonify({
            "search_type": request.args.get("type", "text").lower(),
            "query": keywords,
            "page": request.args.get("page", 1, type=int),
            "has_more": False,
            "count": 0,
            "results": [],
        })

    search_type = request.args.get("type", "text").lower()

    if search_type not in ["text", "images", "videos", "news", "books"]:
        return jsonify({"error": "Invalid search type"}), 400

    # Fixed fast backend per type
    backend_map = {
        "text": "duckduckgo",
        "images": "duckduckgo",
        "videos": "duckduckgo",
        "news": "duckduckgo",
        "books": "openlibrary" # <-- Updated to prevent KeyError
    }
    backend = backend_map.get(search_type, "duckduckgo")

    # Common pagination
    page = request.args.get("page", 1, type=int)
    max_results = request.args.get("max_results")
    if max_results is not None:
        max_results = int(max_results)

    # ----- Text search -----
    if search_type == "text":
        page = max(1, min(page, TEXT_MAX_PAGES))
        if max_results is None:
            max_results = TEXT_MAX_RESULTS_PER_PAGE
        try:
            # Explicitly cast to a list to prevent TypeError crashes!
            raw_results = list(ddgs_with_retry(lambda d: d.text(
                keywords,
                region="us-en",
                safesearch=SAFE_SEARCH,
                timelimit=None,
                max_results=max_results,
                page=page,
                backend=backend,
            )))
            
            # Apply your safety filters
            safe_results = filter_results(raw_results)
            
            # Calculate has_more using the UNFILTERED length, BUT ensure we 
            # don't show the button if safe_results is completely empty
            has_more = (len(raw_results) == max_results) and (page < TEXT_MAX_PAGES) and (len(safe_results) > 0)
            
            response_data = {
                "search_type": search_type,
                "query": keywords,
                "page": page,
                "has_more": has_more,
                "count": len(safe_results),
                "results": safe_results,
            }
            cache.set(cache_key, response_data, timeout=CACHE_TIMEOUT_TEXT)
            return jsonify(response_data)
        except Exception as e:
            print(f"[SEARCH] all retries exhausted — '{keywords}' (text, page {page}): {type(e).__name__}: {e}")
            return jsonify({"error": str(e)}), 500

    # ----- Non-text searches -----
    try:
        # ----- Image search -----
        if search_type == "images":
            if max_results is None:
                max_results = IMAGE_MAX_RESULTS_PER_PAGE
            results = ddgs_with_retry(lambda d: d.images(
                keywords,
                region="us-en",
                safesearch=SAFE_SEARCH,   # always "on"
                timelimit=None,
                max_results=max_results,
                page=page,
                backend=backend,
            ))
            has_more = len(results) == max_results and page < IMAGE_MAX_PAGES
            timeout = CACHE_TIMEOUT_IMAGE

        # ----- Video search -----
        elif search_type == "videos":
            if max_results is None:
                max_results = VIDEO_MAX_RESULTS_PER_PAGE
            results = ddgs_with_retry(lambda d: d.videos(
                keywords,
                region="us-en",
                safesearch=SAFE_SEARCH,   # always "on"
                timelimit=None,
                max_results=max_results,
                page=page,
                backend=backend,
            ))
            has_more = len(results) == max_results and page < VIDEO_MAX_PAGES
            timeout = CACHE_TIMEOUT_VIDEO

        # ----- News search -----
        elif search_type == "news":
            if max_results is None:
                max_results = NEWS_MAX_RESULTS_PER_PAGE
            results = ddgs_with_retry(lambda d: d.news(
                keywords,
                region="us-en",
                safesearch=SAFE_SEARCH,   # always "on"
                timelimit=None,
                max_results=max_results,
                page=page,
                backend=backend,
            ))
            has_more = len(results) == max_results and page < NEWS_MAX_PAGES
            timeout = CACHE_TIMEOUT_NEWS

        # ----- Books search (Open Library API) -----
        elif search_type == "books":
            if max_results is None:
                max_results = BOOKS_MAX_RESULTS_PER_PAGE
            
            # Open Library uses simple page/limit parameters
            open_library_url = f"https://openlibrary.org/search.json?q={urllib.parse.quote(keywords)}&limit={max_results}&page={page}"
            
            try:
                # Add a User-Agent header as a best practice for Open Library
                headers = {'User-Agent': 'PyxisSearchEngine/1.0'}
                resp = requests.get(open_library_url, headers=headers, timeout=10)
                resp.raise_for_status()
                data = resp.json()
                
                raw_items = data.get("docs", [])
                results = []
                
                for item in raw_items:
                    # Extract cover image (M size for the cards)
                    cover_id = item.get("cover_i")
                    image = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None
                    
                    # Extract authors
                    authors = item.get("author_name", [])
                    author_str = ", ".join(authors) if authors else "Unknown"
                    
                    # Get publish year
                    year = item.get("first_publish_year")
                    year_str = str(year) if year else ""

                    # Build URL back to the book on Open Library
                    book_key = item.get("key", "")
                    book_url = f"https://openlibrary.org{book_key}" if book_key else ""

                    results.append({
                        "title": item.get("title", "Untitled"),
                        "author": author_str,
                        "url": book_url,
                        "image": image,
                        "description": "", 
                        "year": year_str
                    })
                
                # Check if there are more results than what we've fetched so far
                total_found = data.get("numFound", 0)
                has_more = total_found > (page * max_results) and page < BOOKS_MAX_PAGES
                timeout = CACHE_TIMEOUT_BOOKS
                
            except Exception as e:
                print(f"[BOOKS API ERROR]: {e}")
                results = []
                has_more = False
                timeout = CACHE_TIMEOUT_BOOKS

        response_data = {
            "search_type": search_type,
            "query": keywords,
            "page": page,
            "has_more": has_more,
            "count": len(results),
            "results": filter_results(results), # Your robust filtering logic is still applied here!
        }
        cache.set(cache_key, response_data, timeout=timeout)
        return jsonify(response_data)
    except Exception as e:
        print(f"[SEARCH] all retries exhausted — '{keywords}' ({search_type}): {type(e).__name__}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/instant", methods=["GET"])
def instant_answer():
    cache_key = make_cache_key()
    cached = cache.get(cache_key)
    if cached is not None:
        return jsonify(cached)

    if not INSTANT_ANSWER_AVAILABLE:
        return jsonify({"error": "Instant answer not available"}), 503

    raw_query = request.args.get("q", "").strip()
    if not raw_query:
        return jsonify({"error": "Missing parameter: q"}), 400

    try:
        query = urllib.parse.unquote(raw_query)
        client = InstantAnswerClient()
        answer, image_url = client.fetch_answer_and_image(query)
        response_data = {"query": query, "answer": answer, "image_url": image_url}
        cache.set(cache_key, response_data, timeout=CACHE_TIMEOUT_INSTANT)
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/help", methods=["GET"])
def help():
    base_url = request.host_url.rstrip("/")
    return jsonify({
        "api": "Pyxis Search API",
        "version": "1.0",
        "endpoints": {
            "/search": "q, type (text|images|videos|news|books), page, max_results (filters ignored; safesearch always on)",
            "/autocomplete": "q, max_results",
            "/instant": "q",
        },
        "examples": {
            "text": f"{base_url}/search?q=python&type=text&page=1",
            "images": f"{base_url}/search?q=cats&type=images&max_results=20&page=1",
            "videos": f"{base_url}/search?q=tutorial&type=videos&max_results=20&page=1",
            "news": f"{base_url}/search?q=technology&type=news&max_results=10&page=1",
            "books": f"{base_url}/search?q=science+fiction&type=books&max_results=10&page=1",
            "autocomplete": f"{base_url}/autocomplete?q=how+to",
            "instant": f"{base_url}/instant?q=elon+musk",
        },
        "policy": {
            "safesearch": "always on – adult content is filtered for all search types",
        },
        "status": {
            "autocomplete": "available" if AUTOCOMPLETE_AVAILABLE else "unavailable",
            "instant_answer": "available" if INSTANT_ANSWER_AVAILABLE else "unavailable",
        },
    })


@app.route("/", methods=["GET"])
def index():
    return jsonify({"api": "Pyxis Search API", "docs": "/help"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)