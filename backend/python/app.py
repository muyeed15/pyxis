"""
Pyxis Search API – Flask application providing search endpoints using DuckDuckGo Search,
with autocomplete suggestions and instant answers.

This module initialises a Flask app with CORS support and Redis caching.
It exposes endpoints for:
    - Text, image, video, news, and book searches (via ddgs library)
    - Query autocompletion (using a local autocomplete engine)
    - Instant answers with optional image (using DuckDuckGo Instant Answer API + image fallback)

All endpoints support caching (Redis) to reduce latency and external API calls.
Cache keys are built from sorted query parameters to ensure parameter-order-independent
cache hits (e.g. ``?q=car&type=images`` and ``?type=images&q=car`` resolve to the same key).
"""

from flask import Flask, jsonify, request
from flask_caching import Cache
from ddgs import DDGS
import os
import time
import urllib.parse
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file (e.g., REDIS_URL)
load_dotenv()

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
MAX_RETRIES = 3
RETRY_DELAYS = [0.5, 1.5, 3.0]  # seconds between retries

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
    Execute a DuckDuckGo search function with automatic retries.

    Args:
        fn (callable): A function that takes a DDGS instance and returns search results.

    Returns:
        The result of the search function.

    Raises:
        The last exception encountered if all retries are exhausted.
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

    Query parameters are sorted alphabetically before being joined, ensuring
    that requests with identical parameters in different orders (e.g.
    ``?q=car&type=images`` vs ``?type=images&q=car``) resolve to the same
    Redis key and therefore the same cached response.

    Returns:
        str: A stable cache key in the form ``<path>?<sorted-query-string>``.
    """
    params = sorted(request.args.items())  # sort for order-independence
    sorted_qs = urllib.parse.urlencode(params)
    return f"{request.path}?{sorted_qs}"


# ----------------------------------------------------------------------
# API endpoints
# ----------------------------------------------------------------------
@app.route("/autocomplete", methods=["GET"])
def autocomplete_suggestions():
    """
    Return autocomplete suggestions for a partial query.

    Query parameters:
        q (str): The partial query (URL‑encoded).
        max_results (int, optional): Maximum number of suggestions (default 10).

    Returns:
        JSON object with:
            - query: the decoded query
            - suggestions: list of suggestion strings
            - count: number of suggestions returned
    """
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
    """
    Perform a search of the specified type using DuckDuckGo.

    Query parameters (common):
        q (str): Search keywords (URL‑encoded).
        type (str): One of ``text``, ``images``, ``videos``, ``news``, ``books``.
            Defaults to ``text``.
        region (str): Region code (e.g. ``us-en``, ``de-de``). Default ``us-en``.
        timelimit (str, optional): Time restriction – ``d`` (day), ``w`` (week),
            ``m`` (month), or ``y`` (year).
        page (int, optional): 1‑based page number. Default ``1``.
        max_results (int, optional): Results per page. Default varies by type.

    Additional filter parameters are accepted for images and videos
    (``size``, ``color``, ``type_image``, ``layout``, ``license_image``,
    ``resolution``, ``duration``, ``license_videos``).
    Refer to the ddgs library documentation for full details.

    Returns:
        JSON object containing:
            - search_type: the type of search performed
            - query: the decoded keywords
            - page: current page number
            - has_more: ``true`` if additional pages are available
            - count: number of results in this response
            - results: list of result items (structure varies by search type)
    """
    cache_key = make_cache_key()
    cached = cache.get(cache_key)
    if cached is not None:
        return jsonify(cached)

    raw_keywords = request.args.get("q")
    if not raw_keywords:
        return jsonify({"error": "Missing parameter: q"}), 400

    keywords = urllib.parse.unquote(raw_keywords)
    search_type = request.args.get("type", "text").lower()

    if search_type not in ["text", "images", "videos", "news", "books"]:
        return jsonify({"error": "Invalid search type"}), 400

    region = request.args.get("region", "us-en")
    timelimit = request.args.get("timelimit")

    # ----- Text search -----
    if search_type == "text":
        page = request.args.get("page", 1, type=int)
        page = max(1, min(page, TEXT_MAX_PAGES))
        try:
            results = ddgs_with_retry(lambda d: d.text(
                keywords,
                region=region,
                safesearch="on",
                timelimit=timelimit,
                max_results=TEXT_MAX_RESULTS_PER_PAGE,
                page=page,
                backend="duckduckgo",
            ))
            has_more = len(results) == TEXT_MAX_RESULTS_PER_PAGE and page < TEXT_MAX_PAGES
            response_data = {
                "search_type": search_type,
                "query": keywords,
                "page": page,
                "has_more": has_more,
                "count": len(results),
                "results": results,
            }
            cache.set(cache_key, response_data, timeout=CACHE_TIMEOUT_TEXT)
            return jsonify(response_data)
        except Exception as e:
            print(f"[SEARCH] all retries exhausted — '{keywords}' (text, page {page}): {type(e).__name__}: {e}")
            return jsonify({"error": str(e)}), 500

    # ----- Non-text searches – shared parameters -----
    safesearch = "on"
    max_results = request.args.get("max_results", 10, type=int)
    page = request.args.get("page", 1, type=int)

    try:
        # ----- Image search -----
        if search_type == "images":
            if not request.args.get("max_results"):
                max_results = IMAGE_MAX_RESULTS_PER_PAGE
            results = ddgs_with_retry(lambda d: d.images(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results,
                page=page,
                backend="duckduckgo",
                size=request.args.get("size"),
                color=request.args.get("color"),
                type_image=request.args.get("type_image"),
                layout=request.args.get("layout"),
                license_image=request.args.get("license_image"),
            ))
            has_more = len(results) == max_results and page < IMAGE_MAX_PAGES
            timeout = CACHE_TIMEOUT_IMAGE

        # ----- Video search -----
        elif search_type == "videos":
            if not request.args.get("max_results"):
                max_results = VIDEO_MAX_RESULTS_PER_PAGE
            results = ddgs_with_retry(lambda d: d.videos(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results,
                page=page,
                backend="duckduckgo",
                resolution=request.args.get("resolution"),
                duration=request.args.get("duration"),
                license_videos=request.args.get("license_videos"),
            ))
            has_more = len(results) == max_results and page < VIDEO_MAX_PAGES
            timeout = CACHE_TIMEOUT_VIDEO

        # ----- News search -----
        elif search_type == "news":
            if not request.args.get("max_results"):
                max_results = NEWS_MAX_RESULTS_PER_PAGE
            results = ddgs_with_retry(lambda d: d.news(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results,
                page=page,
                backend="duckduckgo",
            ))
            has_more = len(results) == max_results and page < NEWS_MAX_PAGES
            timeout = CACHE_TIMEOUT_NEWS

        # ----- Books search -----
        elif search_type == "books":
            if not request.args.get("max_results"):
                max_results = BOOKS_MAX_RESULTS_PER_PAGE
            results = ddgs_with_retry(lambda d: d.books(
                keywords,
                max_results=max_results,
                page=page,
                backend="auto",
            ))
            has_more = len(results) == max_results and page < BOOKS_MAX_PAGES
            timeout = CACHE_TIMEOUT_BOOKS

        response_data = {
            "search_type": search_type,
            "query": keywords,
            "page": page,
            "has_more": has_more,
            "count": len(results),
            "results": results,
        }
        cache.set(cache_key, response_data, timeout=timeout)
        return jsonify(response_data)
    except Exception as e:
        print(f"[SEARCH] all retries exhausted — '{keywords}' ({search_type}): {type(e).__name__}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/instant", methods=["GET"])
def instant_answer():
    """
    Fetch an instant answer and a related image for a query.

    Query parameters:
        q (str): The query (URL‑encoded).

    Returns:
        JSON object with:
            - query: the decoded query
            - answer: the textual instant answer, or ``null`` if unavailable
            - image_url: URL of a related safe image, or ``null`` if unavailable
    """
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
    """
    Return API documentation and status information.

    Returns:
        JSON object with endpoint descriptions, example URLs, and service
        availability flags for optional modules (autocomplete, instant answer).
    """
    base_url = request.host_url.rstrip("/")
    return jsonify({
        "api": "Pyxis Search API",
        "version": "1.0",
        "endpoints": {
            "/search": "q, type (text|images|videos|news|books), region, safesearch, max_results, page, backend",
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
        "status": {
            "autocomplete": "available" if AUTOCOMPLETE_AVAILABLE else "unavailable",
            "instant_answer": "available" if INSTANT_ANSWER_AVAILABLE else "unavailable",
        },
    })


@app.route("/", methods=["GET"])
def index():
    """
    Root endpoint – returns basic API information and a link to the help page.
    """
    return jsonify({"api": "Pyxis Search API", "docs": "/help"})


# ----------------------------------------------------------------------
# Run the Flask development server
# ----------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)