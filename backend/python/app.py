from flask import Flask, jsonify, request
from ddgs import DDGS
import os
import time
import urllib.parse
from flask_cors import CORS

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

try:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from instantsearch.instantsearch import InstantAnswerClient
    INSTANT_ANSWER_AVAILABLE = True
except Exception as e:
    print(f"Instant answer client import failed: {e}")
    INSTANT_ANSWER_AVAILABLE = False

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.json.ensure_ascii = False

# Retry 3 times with short backoff — fail fast so the frontend retries quickly
MAX_RETRIES = 3
RETRY_DELAYS = [0.5, 1.5, 3.0]


def ddgs_with_retry(fn):
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


@app.route("/autocomplete", methods=["GET"])
def autocomplete_suggestions():
    if not AUTOCOMPLETE_AVAILABLE:
        return jsonify({"error": "Autocomplete not available"}), 503

    raw_query = request.args.get("q", "").strip()
    if not raw_query:
        return jsonify({"error": "Missing parameter: q"}), 400

    try:
        max_results = request.args.get("max_results", 10, type=int)
        query = urllib.parse.unquote(raw_query)
        suggestions = autocomplete.generate_suggestions(query, max_results=max_results)
        return jsonify({"query": query, "suggestions": suggestions, "count": len(suggestions)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/search", methods=["GET"])
def search():
    raw_keywords = request.args.get("q")
    if not raw_keywords:
        return jsonify({"error": "Missing parameter: q"}), 400

    keywords = urllib.parse.unquote(raw_keywords)
    search_type = request.args.get("type", "text").lower()

    if search_type not in ["text", "images", "videos", "news", "books"]:
        return jsonify({"error": "Invalid search type"}), 400

    region = request.args.get("region", "us-en")
    safesearch = request.args.get("safesearch", "moderate")
    timelimit = request.args.get("timelimit")
    max_results = request.args.get("max_results", 10, type=int)
    page = request.args.get("page", 1, type=int)
    backend = request.args.get("backend", "auto")

    try:
        if search_type == "text":
            results = ddgs_with_retry(lambda d: d.text(
                keywords, region=region, safesearch=safesearch,
                timelimit=timelimit, max_results=max_results,
                page=page, backend=backend,
            ))

        elif search_type == "images":
            results = ddgs_with_retry(lambda d: d.images(
                keywords, region=region, safesearch=safesearch,
                timelimit=timelimit, max_results=max_results,
                page=page, backend=backend,
                size=request.args.get("size"),
                color=request.args.get("color"),
                type_image=request.args.get("type_image"),
                layout=request.args.get("layout"),
                license_image=request.args.get("license_image"),
            ))

        elif search_type == "videos":
            results = ddgs_with_retry(lambda d: d.videos(
                keywords, region=region, safesearch=safesearch,
                timelimit=timelimit, max_results=max_results,
                page=page, backend=backend,
                resolution=request.args.get("resolution"),
                duration=request.args.get("duration"),
                license_videos=request.args.get("license_videos"),
            ))

        elif search_type == "news":
            results = ddgs_with_retry(lambda d: d.news(
                keywords, region=region, safesearch=safesearch,
                timelimit=timelimit, max_results=max_results,
                page=page, backend=backend,
            ))

        elif search_type == "books":
            results = ddgs_with_retry(lambda d: d.books(
                keywords, max_results=max_results, page=page, backend=backend,
            ))

        return jsonify({
            "search_type": search_type,
            "query": keywords,
            "count": len(results),
            "results": results,
        })

    except Exception as e:
        print(f"[SEARCH] all retries exhausted — '{keywords}' ({search_type}): {type(e).__name__}: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/instant", methods=["GET"])
def instant_answer():
    if not INSTANT_ANSWER_AVAILABLE:
        return jsonify({"error": "Instant answer not available"}), 503

    raw_query = request.args.get("q", "").strip()
    if not raw_query:
        return jsonify({"error": "Missing parameter: q"}), 400

    try:
        query = urllib.parse.unquote(raw_query)
        client = InstantAnswerClient()
        answer, image_url = client.fetch_answer_and_image(query)
        return jsonify({"query": query, "answer": answer, "image_url": image_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/help", methods=["GET"])
def help():
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
            "text": f"{base_url}/search?q=python&type=text",
            "images": f"{base_url}/search?q=cats&type=images&max_results=30",
            "videos": f"{base_url}/search?q=tutorial&type=videos",
            "news": f"{base_url}/search?q=technology&type=news&timelimit=d",
            "books": f"{base_url}/search?q=science+fiction&type=books",
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
    return jsonify({
        "api": "Pyxis Search API",
        "docs": "/help",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)