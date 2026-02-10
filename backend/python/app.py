from flask import Flask, jsonify, request
from ddgs import DDGS

app = Flask(__name__)
app.json.ensure_ascii = False

@app.route('/search', methods=['GET'])
def search():
    keywords = request.args.get('q')
    search_type = request.args.get('type', 'text').lower()
    
    if not keywords:
        return jsonify({"error": "Missing required parameter: q"}), 400
    
    if search_type not in ['text', 'images', 'videos', 'news', 'books']:
        return jsonify({"error": "Invalid search type. Must be: text, images, videos, news, or books"}), 400
    
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


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "DDGS Multi-Type Search API",
        "endpoint": "/search",
        "description": "Universal search endpoint supporting text, images, videos, news, and books",
        "required_params": {
            "q": "search keywords",
            "type": "text | images | videos | news | books"
        },
        "optional_params": {
            "common": {
                "region": "region code (default: us-en)",
                "safesearch": "on | moderate | off (default: moderate)",
                "timelimit": "d | w | m | y (default: None)",
                "max_results": "number (default: 10)",
                "page": "page number (default: 1)",
                "backend": "auto (default) or specific backend"
            },
            "text_backends": "bing, brave, duckduckgo, google, grokipedia, mojeek, yandex, yahoo, wikipedia",
            "images_backends": "duckduckgo",
            "videos_backends": "duckduckgo",
            "news_backends": "bing, duckduckgo, yahoo",
            "books_backends": "annasarchive",
            "images_only": {
                "size": "Small | Medium | Large | Wallpaper",
                "color": "color | Monochrome | Red | Orange | Yellow | Green | Blue | Purple | Pink | Brown | Black | Gray | Teal | White",
                "type_image": "photo | clipart | gif | transparent | line",
                "layout": "Square | Tall | Wide",
                "license_image": "any | Public | Share | ShareCommercially | Modify | ModifyCommercially"
            },
            "videos_only": {
                "resolution": "high | standard",
                "duration": "short | medium | long",
                "license_videos": "creativeCommon | youtube"
            }
        },
        "examples": {
            "text": "/search?q=python&type=text&max_results=5",
            "text_with_backend": "/search?q=python&type=text&backend=google&max_results=5",
            "images": "/search?q=butterfly&type=images&color=Monochrome&max_results=10",
            "videos": "/search?q=tutorials&type=videos&duration=short&resolution=high",
            "news": "/search?q=technology&type=news&timelimit=d",
            "books": "/search?q=sea+wolf+jack+london&type=books&max_results=10",
            "pdf_search": "/search?q=machine+learning+filetype:pdf&type=text&max_results=20"
        }
    })


if __name__ == '__main__':
    app.run(debug=True)