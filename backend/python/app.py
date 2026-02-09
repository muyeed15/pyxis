from flask import Flask, jsonify, request
from ddgs import DDGS

app = Flask(__name__)
app.json.ensure_ascii = False

@app.route('/search', methods=['GET'])
def search():
    """
    Universal search endpoint supporting multiple search types.
    
    Required params:
        q: search keywords
        type: search type (text, images, videos, news)
    
    Common optional params:
        region: region code (default: wt-wt)
        safesearch: on, moderate, off (default: off)
        timelimit: d, w, m, y (default: y)
        max_results: maximum number of results (default: 10)
    
    Image-specific params:
        size: Small, Medium, Large, Wallpaper
        color: color, Monochrome, Red, Orange, Yellow, Green, Blue, Purple, Pink, Brown, Black, Gray, Teal, White
        type_image: photo, clipart, gif, transparent, line
        layout: Square, Tall, Wide
        license_image: any, Public, Share, ShareCommercially, Modify, ModifyCommercially
    
    Video-specific params:
        resolution: high, standard
        duration: short, medium, long
        license_videos: creativeCommon, youtube
    """
    keywords = request.args.get('q')
    search_type = request.args.get('type', 'text').lower()
    
    if not keywords:
        return jsonify({"error": "Missing required parameter: q"}), 400
    
    if search_type not in ['text', 'images', 'videos', 'news']:
        return jsonify({"error": "Invalid search type. Must be: text, images, videos, or news"}), 400
    
    # Common parameters
    region = request.args.get('region', 'wt-wt')
    safesearch = request.args.get('safesearch', 'off')
    timelimit = request.args.get('timelimit', 'y')
    max_results = request.args.get('max_results', 10, type=int)
    
    try:
        ddgs = DDGS()
        
        if search_type == 'text':
            backend = request.args.get('backend', 'auto')
            results = ddgs.text(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                backend=backend,
                max_results=max_results
            )
        
        elif search_type == 'images':
            results = ddgs.images(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                size=request.args.get('size'),
                color=request.args.get('color'),
                type_image=request.args.get('type_image'),
                layout=request.args.get('layout'),
                license_image=request.args.get('license_image'),
                max_results=max_results
            )
        
        elif search_type == 'videos':
            results = ddgs.videos(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                resolution=request.args.get('resolution'),
                duration=request.args.get('duration'),
                license_videos=request.args.get('license_videos'),
                max_results=max_results
            )
        
        elif search_type == 'news':
            results = ddgs.news(
                keywords,
                region=region,
                safesearch=safesearch,
                timelimit=timelimit,
                max_results=max_results
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
    """API documentation"""
    return jsonify({
        "message": "DuckDuckGo Multi-Type Search API",
        "endpoint": "/search",
        "description": "Universal search endpoint supporting text, images, videos, and news",
        "required_params": {
            "q": "search keywords",
            "type": "text | images | videos | news"
        },
        "optional_params": {
            "common": {
                "region": "region code (default: wt-wt)",
                "safesearch": "on | moderate | off (default: off)",
                "timelimit": "d | w | m | y (default: y)",
                "max_results": "number (default: 10)"
            },
            "text_only": {
                "backend": "auto | html | lite | bing (default: auto)"
            },
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
            "images": "/search?q=butterfly&type=images&color=Monochrome&max_results=10",
            "videos": "/search?q=tutorials&type=videos&duration=short&resolution=high",
            "news": "/search?q=technology&type=news&timelimit=d",
            "pdf_search": "/search?q=machine+learning+filetype:pdf&type=text&max_results=20"
        }
    })


if __name__ == '__main__':
    app.run(debug=True)