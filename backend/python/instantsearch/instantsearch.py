"""
Instant answer retrieval tool using DuckDuckGo Instant Answer API and image fetching
from Wikipedia and Wikimedia Commons.

This module provides classes to fetch instant answers for a query and optionally
retrieve a related safe image. It includes:
    - Safety filtering for image URLs (by extension and banned keywords).
    - Multi-source image fetching with timeout and concurrency.
    - Command-line interface for interactive or one-shot usage.
"""

import sys
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
from typing import Optional, Tuple

import requests


# Constants for image safety
SAFE_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
"""Tuple of file extensions considered safe for images."""

BLOCKED_KEYWORDS = ("explicit", "nude", "nsfw", "porn", "xxx", "sex", "adult")
"""Tuple of keywords that indicate unsafe or adult content."""


def is_safe_image_url(url: str) -> bool:
    """
    Check if an image URL is safe based on extension and content keywords.

    Args:
        url (str): The image URL to validate.

    Returns:
        bool: True if the URL ends with a safe image extension and contains
              no blocked keywords (case‑insensitive), False otherwise.
    """
    lower = url.lower()
    if not any(lower.endswith(ext) for ext in SAFE_IMAGE_EXTENSIONS):
        return False
    if any(kw in lower for kw in BLOCKED_KEYWORDS):
        return False
    return True


class MultiSourceImageFetcher:
    """
    Fetches an image URL for a given query from multiple sources concurrently.

    Sources:
        - Wikipedia (page thumbnail)
        - Wikimedia Commons (search results)

    The first valid (safe) image URL returned within the timeout is used.
    """

    def __init__(self):
        """Initialize a requests Session with a common User‑Agent header."""
        self.session = requests.Session()
        self.session.headers.update(
            {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
        )

    def get_image(self, query: str) -> Optional[str]:
        """
        Retrieve a safe image URL for the given query from available sources.

        Args:
            query (str): Search term.

        Returns:
            Optional[str]: A safe image URL if found within the timeout,
                           otherwise None.
        """
        sources = [self._get_wikipedia_image, self._get_wikimedia_commons_image]
        with ThreadPoolExecutor(max_workers=2) as ex:
            futures = {ex.submit(src, query): src for src in sources}
            try:
                for future in as_completed(futures, timeout=4):
                    try:
                        result = future.result()
                        if result and is_safe_image_url(result):
                            return result
                    except Exception:
                        continue
            except TimeoutError:
                pass
        return None

    def _get_wikipedia_image(self, query: str) -> Optional[str]:
        """
        Fetch a thumbnail image from Wikipedia for the given page title.

        Args:
            query (str): Wikipedia page title.

        Returns:
            Optional[str]: URL of the thumbnail (size ~800px) if available,
                           otherwise None.
        """
        try:
            params = {
                "action": "query",
                "format": "json",
                "titles": query,
                "prop": "pageimages",
                "pithumbsize": 800,
            }
            r = self.session.get(
                "https://en.wikipedia.org/w/api.php", params=params, timeout=4
            )
            pages = r.json().get("query", {}).get("pages", {})
            for page in pages.values():
                if "thumbnail" in page:
                    return page["thumbnail"]["source"]
            return None
        except Exception:
            return None

    def _get_wikimedia_commons_image(self, query: str) -> Optional[str]:
        """
        Search Wikimedia Commons for images matching the query and return the first thumbnail.

        Args:
            query (str): Search term.

        Returns:
            Optional[str]: Thumbnail URL of the first image result if found,
                           otherwise None.
        """
        try:
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
            r = self.session.get(
                "https://commons.wikimedia.org/w/api.php", params=params, timeout=4
            )
            pages = r.json().get("query", {}).get("pages", {})
            for page in pages.values():
                imageinfo = page.get("imageinfo", [])
                if imageinfo and "thumburl" in imageinfo[0]:
                    return imageinfo[0]["thumburl"]
            return None
        except Exception:
            return None


class InstantAnswerClient:
    """
    Client for the DuckDuckGo Instant Answer API.

    Fetches textual instant answers and, optionally, a related safe image
    by combining results from the API and the MultiSourceImageFetcher.
    """

    def __init__(self):
        """Initialize the API client with base URL and a shared requests Session."""
        self.base_url = "https://api.duckduckgo.com"
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "InstantAnswerCLI/1.0"})
        self.image_fetcher = MultiSourceImageFetcher()

    def fetch_answer_and_image(self, query: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Fetch both the instant answer text and a related safe image concurrently.

        Args:
            query (str): User's search query.

        Returns:
            Tuple[Optional[str], Optional[str]]: A pair (answer_text, image_url).
                If either is missing, both are returned as None.
        """
        with ThreadPoolExecutor(max_workers=2) as ex:
            answer_future = ex.submit(self._fetch_answer, query)
            image_future = ex.submit(self.image_fetcher.get_image, query)
            answer = answer_future.result()
            try:
                image_url = image_future.result(timeout=5)
            except Exception:
                image_url = None

        # Only return both if both are present
        if answer and image_url:
            return answer, image_url
        return None, None

    def _fetch_answer(self, query: str) -> Optional[str]:
        """
        Call the DuckDuckGo Instant Answer API and extract the answer text.

        Args:
            query (str): Search query.

        Returns:
            Optional[str]: The extracted answer if available, else None.
        """
        try:
            params = {
                "q": query,
                "format": "json",
                "no_html": 1,
                "skip_disambig": 1,
                "kp": 1,  # Safe search
            }
            r = self.session.get(self.base_url, params=params, timeout=6)
            r.raise_for_status()
            return self._extract_answer(r.json())
        except requests.RequestException:
            return None

    def _extract_answer(self, data: dict) -> Optional[str]:
        """
        Extract the most relevant answer field from the API JSON response.

        Priority order: Abstract, Answer, Definition, AbstractText.
        The first non‑empty value found is returned.

        Args:
            data (dict): Parsed JSON response from DuckDuckGo.

        Returns:
            Optional[str]: The answer string, or None if no field contains text.
        """
        for field in ["Abstract", "Answer", "Definition", "AbstractText"]:
            val = data.get(field, "").strip()
            if val:
                return val
        return None


def main() -> None:
    """
    Command-line entry point.

    If command-line arguments are provided, they are treated as a single query
    and the result (answer and image URL) is printed once. Otherwise, an
    interactive loop is started where the user can enter queries repeatedly.
    """
    client = InstantAnswerClient()

    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        answer, image_url = client.fetch_answer_and_image(query)
        print(f"Query: {query}\nAnswer: {answer or 'None'}\nImage: {image_url or 'None'}")
        sys.exit(0)

    print("Instant Answer Tool (Ctrl+C to exit)")
    try:
        while True:
            try:
                query = input("> ").strip()
            except EOFError:
                break
            if not query or query.lower() in ("quit", "exit"):
                continue
            answer, image_url = client.fetch_answer_and_image(query)
            print(f"\nAnswer: {answer or 'None'}")
            if image_url:
                print(f"Image:  {image_url}")
            print()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()