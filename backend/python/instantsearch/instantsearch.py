#!/usr/bin/env python3
"""
Instant Answer and Image Search Tool
Fetches answers from DuckDuckGo and images from multiple free sources.
"""

import sys
import requests
from typing import Optional, Tuple
from datetime import datetime
import urllib.parse


class MultiSourceImageFetcher:
    """Fetch images from multiple free sources with fallback."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
        )

    def get_image(self, query: str) -> Optional[str]:
        """Try multiple sources until one returns an image."""
        sources = [
            self._get_wikipedia_image,
            self._get_wikimedia_commons_image,
            self._get_unsplash_image,
            self._get_lorem_picsum_image,
        ]

        for source in sources:
            try:
                image_url = source(query)
                if image_url:
                    return image_url
            except Exception:
                continue

        return None

    def _get_wikipedia_image(self, query: str) -> Optional[str]:
        """Get image from Wikipedia."""
        try:
            url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "titles": query,
                "prop": "pageimages",
                "pithumbsize": 800,
            }
            response = self.session.get(url, params=params, timeout=5)
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                if "thumbnail" in page:
                    return page["thumbnail"]["source"]
            return None
        except Exception:
            return None

    def _get_wikimedia_commons_image(self, query: str) -> Optional[str]:
        """Get image from Wikimedia Commons."""
        try:
            url = "https://commons.wikimedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrnamespace": "6",  # File namespace
                "gsrsearch": query,
                "gsrlimit": "1",
                "prop": "imageinfo",
                "iiprop": "url",
                "iiurlwidth": "800",
            }
            response = self.session.get(url, params=params, timeout=5)
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                imageinfo = page.get("imageinfo", [])
                if imageinfo and "thumburl" in imageinfo[0]:
                    return imageinfo[0]["thumburl"]
            return None
        except Exception:
            return None

    def _get_unsplash_image(self, query: str) -> Optional[str]:
        """Get image from Unsplash public feed (no API key needed for demo)."""
        try:
            # Using Unsplash Source API (free, no key required)
            encoded_query = urllib.parse.quote(query)
            # This returns a redirect to an actual image
            url = f"https://source.unsplash.com/800x600/?{encoded_query}"

            # Check if the URL is accessible
            response = self.session.head(url, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                return response.url
            return None
        except Exception:
            return None

    def _get_lorem_picsum_image(self, query: str) -> Optional[str]:
        """Get a random image from Lorem Picsum (fallback option)."""
        try:
            # Lorem Picsum provides random images
            # We'll use query hash to get consistent images for same queries
            seed = abs(hash(query)) % 1000
            url = f"https://picsum.photos/seed/{seed}/800/600"

            response = self.session.head(url, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                return response.url
            return None
        except Exception:
            return None


class InstantAnswerClient:
    """Client for fetching instant answers from DuckDuckGo."""

    def __init__(self):
        self.base_url = "https://api.duckduckgo.com"
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "InstantAnswerCLI/1.0"})
        self.image_fetcher = MultiSourceImageFetcher()

    def fetch_answer_and_image(self, query: str) -> Tuple[str, Optional[str]]:
        """Fetch instant answer and image from multiple sources."""
        try:
            params = {
                "q": query,
                "format": "json",
                "no_html": 1,
                "skip_disambig": 1,
                "kp": 1,
            }
            response = self.session.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            answer = self._extract_answer(data)
            image_url = self.image_fetcher.get_image(query)

            return answer, image_url

        except requests.RequestException as e:
            return f"Error: {str(e)}", None

    def _extract_answer(self, data: dict) -> str:
        """Extract answer from API response."""
        answer_fields = ["Abstract", "Answer", "Definition", "AbstractText"]

        for field in answer_fields:
            if data.get(field) and data[field].strip():
                return data[field].strip()

        if data.get("Redirect"):
            return f"Redirects to: {data['Redirect']}"

        return "No instant answer available."


def display_results(query: str, answer: str, image_url: Optional[str]) -> None:
    """Display results."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"\nQuery: {query}")
    print(f"Time: {timestamp}")
    print(f"\nAnswer:\n{answer}")

    if image_url:
        print(f"\nImage URL:\n{image_url}")
    else:
        print("\nNo image found.")
    print()


def main() -> None:
    """Main entry point."""
    client = InstantAnswerClient()

    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        answer, image_url = client.fetch_answer_and_image(query)
        display_results(query, answer, image_url)
        sys.exit(0)

    print("Instant Answer & Image Search Tool")
    print("Commands: quit, exit, help")
    print()

    try:
        while True:
            try:
                query = input("> ").strip()
            except EOFError:
                print("\nExiting...")
                break

            if query.lower() in ("quit", "exit"):
                break
            elif query.lower() == "help":
                print("Enter any question to get an instant answer and image.")
                print(
                    "Image sources: Wikipedia → Wikimedia Commons → Unsplash → Lorem Picsum"
                )
                continue

            if not query:
                continue

            answer, image_url = client.fetch_answer_and_image(query)
            display_results(query, answer, image_url)

    except KeyboardInterrupt:
        print("\n\nInterrupted. Exiting...")
        sys.exit(130)


if __name__ == "__main__":
    main()
