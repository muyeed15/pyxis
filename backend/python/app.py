from flask import Flask, jsonify, request
from ddgs import DDGS
import os
import urllib.parse

try:
    from autocomplete.autocomplete import Autocomplete
    current_dir = os.path.dirname(os.path.abspath(__file__))
    autocomplete_data_dir = os.path.join(current_dir, 'autocomplete', 'dataset')
    
    autocomplete = Autocomplete(
        entities_csv=os.path.join(autocomplete_data_dir, 'entities.csv'),
        keywords_csv=os.path.join(autocomplete_data_dir, 'keywords.csv'),
        patterns_csv=os.path.join(autocomplete_data_dir, 'patterns.csv')
    )
    AUTOCOMPLETE_AVAILABLE = True
except Exception as e:
    print(f"Autocomplete failed: {e}")
    AUTOCOMPLETE_AVAILABLE = False

app = Flask(__name__)
app.json.ensure_ascii = False


@app.route('/autocomplete', methods=['GET'])
def autocomplete_suggestions():
    """
    Get search query suggestions.
    
    Required:
    - q: partial search query
    
    Optional:
    - max_results: number of suggestions (default: 10)
    
    Example: /autocomplete?q=pyth&max_results=5
    """
    if not AUTOCOMPLETE_AVAILABLE:
        return jsonify({
            "error": "Autocomplete system is not available"
        }), 503
    
    raw_query = request.args.get('q', '').strip()
    
    if not raw_query:
        return jsonify({
            "error": "Missing required parameter: q"
        }), 400
    
    try:
        max_results = request.args.get('max_results', 10, type=int)
        query = urllib.parse.unquote(raw_query)
        suggestions = autocomplete.generate_suggestions(query, max_results=max_results)
        
        return jsonify({
            "query": query,
            "suggestions": suggestions,
            "count": len(suggestions)
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route('/search', methods=['GET'])
def search():
    """
    Search for content by type.
    
    Required:
    - q: search keywords
    - type: search type (text|images|videos|news|books)
    
    Optional parameters vary by type.
    See /help for complete documentation.
    """
    raw_keywords = request.args.get('q')
    if not raw_keywords:
        return jsonify({"error": "Missing required parameter: q"}), 400
    
    keywords = urllib.parse.unquote(raw_keywords)
    
    search_type = request.args.get('type', 'text').lower()
    
    if search_type not in ['text', 'images', 'videos', 'news', 'books']:
        return jsonify({"error": "Invalid search type"}), 400
    
    region = request.args.get('region', 'us-en')
    safesearch = request.args.get('safesearch', 'moderate')
    timelimit = request.args.get('timelimit')
    max_results = request.args.get('max_results', 10, type=int)
    page = request.args.get('page', 1, type=int)
    
    try:
        ddgs = DDGS()
        
        if search_type == 'text':
            backend = request.args.get('backend', 'auto')
            results = ddgs.text(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results,
                page=page,
                backend=backend
            )
        
        elif search_type == 'images':
            backend = request.args.get('backend', 'auto')
            results = ddgs.images(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results,
                page=page,
                backend=backend,
                size=request.args.get('size'),
                color=request.args.get('color'),
                type_image=request.args.get('type_image'),
                layout=request.args.get('layout'),
                license_image=request.args.get('license_image')
            )
        
        elif search_type == 'videos':
            backend = request.args.get('backend', 'auto')
            results = ddgs.videos(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results,
                page=page,
                backend=backend,
                resolution=request.args.get('resolution'),
                duration=request.args.get('duration'),
                license_videos=request.args.get('license_videos')
            )
        
        elif search_type == 'news':
            backend = request.args.get('backend', 'auto')
            results = ddgs.news(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results,
                page=page,
                backend=backend
            )
        
        elif search_type == 'books':
            backend = request.args.get('backend', 'auto')
            results = ddgs.books(
                keywords,
                max_results=max_results,
                page=page,
                backend=backend
            )
        
        return jsonify({
            "search_type": search_type,
            "query": keywords,
            "count": len(results),
            "results": results
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/help', methods=['GET'])
def help():
    """
    Complete API documentation with examples.
    """
    base_url = request.host_url.rstrip('/')
    
    examples = {
        "text_search": {
            "description": "Search for text content",
            "url": f"{base_url}/search?q=python%20tutorial&type=text",
            "with_backend": f"{base_url}/search?q=flask%20api&type=text&backend=google",
            "with_pagination": f"{base_url}/search?q=machine%20learning&type=text&page=2&max_results=20",
            "with_timelimit": f"{base_url}/search?q=ai%20news&type=text&timelimit=d"
        },
        "image_search": {
            "description": "Search for images with filters",
            "basic": f"{base_url}/search?q=cats&type=images",
            "with_color": f"{base_url}/search?q=landscape&type=images&color=Blue",
            "with_size": f"{base_url}/search?q=wallpaper&type=images&size=Large",
            "with_type": f"{base_url}/search?q=diagram&type=images&type_image=line"
        },
        "video_search": {
            "description": "Search for videos",
            "basic": f"{base_url}/search?q=tutorial&type=videos",
            "short_videos": f"{base_url}/search?q=cooking&type=videos&duration=short",
            "high_quality": f"{base_url}/search?q=nature&type=videos&resolution=high"
        },
        "news_search": {
            "description": "Search for news articles",
            "basic": f"{base_url}/search?q=technology&type=news",
            "recent": f"{base_url}/search?q=sports&type=news&timelimit=d",
            "with_region": f"{base_url}/search?q=politics&type=news&region=uk-en"
        },
        "book_search": {
            "description": "Search for books",
            "basic": f"{base_url}/search?q=science%20fiction&type=books",
            "author_search": f"{base_url}/search?q=stephen%20king&type=books"
        },
        "autocomplete": {
            "description": "Get search suggestions",
            "basic": f"{base_url}/autocomplete?q=how%20to",
            "with_limit": f"{base_url}/autocomplete?q=what%20is&max_results=15",
            "technical": f"{base_url}/autocomplete?q=neural%20network"
        },
        "special_queries": {
            "description": "Advanced search patterns",
            "pdf_search": f"{base_url}/search?q=machine%20learning%20filetype%3Apdf&type=text",
            "exact_phrase": f"{base_url}/search?q=%22python%20programming%22&type=text",
            "exclude_terms": f"{base_url}/search?q=python%20-java&type=text",
            "math_query": f"{base_url}/search?q=1%2B1%20equals&type=text"
        }
    }
    
    tutorials = {
        "getting_started": [
            "1. Start with autocomplete to get query ideas: GET /autocomplete?q=your_topic",
            "2. Use the suggestions or your own query with search: GET /search?q=query&type=text",
            "3. Adjust parameters like max_results, region, safesearch as needed"
        ],
        "common_use_cases": [
            "Research: Use text search with multiple pages and backend options",
            "Media collection: Use images/videos with size/duration filters",
            "News monitoring: Use news search with timelimit parameter",
            "Learning: Combine autocomplete suggestions with book searches"
        ],
        "tips": [
            "URL encode all spaces as %20 or +",
            "For literal + sign, encode as %2B",
            "Use exact phrases by wrapping in quotes: %22phrase%22",
            "Specify file types: filetype:pdf, filetype:docx",
            "Exclude terms with - (minus sign)"
        ]
    }
    
    return jsonify({
        "api": "Pyxis Search API",
        "version": "1.0",
        "endpoints": {
            "/": "Basic info",
            "/help": "This documentation",
            "/search": "Search endpoint",
            "/autocomplete": "Autocomplete suggestions"
        },
        "quick_start": tutorials["getting_started"],
        "examples": examples,
        "tutorials": tutorials,
        "parameters": {
            "common": {
                "q": "Search query (required, URL encoded)",
                "type": "text|images|videos|news|books (default: text)",
                "region": "Region code like us-en, uk-en (default: us-en)",
                "safesearch": "on|moderate|off (default: moderate)",
                "max_results": "Number of results (default: 10)",
                "page": "Page number (default: 1)",
                "backend": "Search backend (varies by type)"
            },
            "images_only": {
                "size": "Small|Medium|Large|Wallpaper",
                "color": "color|Monochrome|Red|Blue|etc",
                "type_image": "photo|clipart|gif|transparent|line",
                "layout": "Square|Tall|Wide"
            },
            "videos_only": {
                "resolution": "high|standard",
                "duration": "short|medium|long"
            }
        },
        "notes": [
            "Autocomplete status: " + ("available" if AUTOCOMPLETE_AVAILABLE else "unavailable"),
            "All endpoints return JSON",
            "Use proper URL encoding for special characters",
            "For support, check API response structure"
        ]
    })


@app.route('/', methods=['GET'])
def index():
    """
    Basic API information and quick links.
    """
    return jsonify({
        "api": "Pyxis Search API",
        "description": "Multi-type search with autocomplete suggestions",
        "endpoints": {
            "/": "This info",
            "/help": "Full documentation with examples",
            "/search": "Search endpoint",
            "/autocomplete": "Query suggestions"
        },
        "quick_examples": {
            "search_text": "/search?q=python&type=text",
            "search_images": "/search?q=cats&type=images",
            "autocomplete": "/autocomplete?q=how%20to"
        },
        "documentation": "Visit /help for complete API reference, tutorials, and examples"
    })


if __name__ == '__main__':
    app.run(debug=True)