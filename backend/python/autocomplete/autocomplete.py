"""
Autocomplete suggestion engine for search queries.

This module provides a class `Autocomplete` that loads entities, keywords,
and patterns from CSV files, builds efficient indexes, and generates query
suggestions using multiple strategies (direct matches, multi-word completions,
pattern-based expansions, etc.). It includes caching to improve performance
for repeated queries.

Typical usage:
    ac = Autocomplete('entities.csv', 'keywords.csv', 'patterns.csv')
    suggestions = ac.generate_suggestions('how to')
"""

import csv
from collections import defaultdict
from functools import lru_cache


class Autocomplete:
    """
    A query autocompletion engine backed by CSV data.

    The engine loads:
        - entities (grouped by category)
        - keywords (flat list)
        - patterns (categorized as questions, actions, modifiers)

    It builds prefix indexes for fast first-word lookups and uses multiple
    matching strategies to suggest completions. Results are cached to avoid
    recomputation for identical queries.
    """

    def __init__(self, entities_csv, keywords_csv, patterns_csv):
        """
        Initialize the autocomplete engine by loading data from CSV files.

        Args:
            entities_csv (str): Path to CSV file with columns 'category', 'entity'.
            keywords_csv (str): Path to CSV file with one keyword per row.
            patterns_csv (str): Path to CSV file with columns 'type', 'pattern'.
        """
        self.entities = self._load_entities(entities_csv)
        self.keywords = self._load_keywords(keywords_csv)
        self.patterns = self._load_patterns(patterns_csv)
        self._build_index()
        # Result cache: (query, max_results) -> list of suggestions
        self._cache: dict = {}
        self._cache_max = 512  # Maximum number of entries before eviction

    def _build_index(self):
        """
        Build internal data structures for fast lookups:
            - Flattened list of all entities.
            - Mapping from entity to its categories.
            - Prefix indexes for entities and keywords (first word).
            - Cached flat list of all patterns.
        """
        self.all_entities = []
        self.entity_to_categories = defaultdict(list)

        # Flatten entities and build category mapping
        for category, entities_list in self.entities.items():
            self.all_entities.extend(entities_list)
            for entity in entities_list:
                self.entity_to_categories[entity].append(category)

        self.all_entities_set = set(self.all_entities)
        self.keywords_set = set(self.keywords)

        # Extract patterns by type
        self.question_patterns = self.patterns.get("questions", [])
        self.action_patterns = self.patterns.get("actions", [])
        self.modifier_patterns = self.patterns.get("modifiers", [])

        # Prefix indexes: first word -> list of full entities/keywords
        self.entity_prefix_index = defaultdict(list)
        for entity in self.all_entities:
            words = entity.split()
            if words:
                self.entity_prefix_index[words[0]].append(entity)

        self.keyword_prefix_index = defaultdict(list)
        for keyword in self.keywords:
            words = keyword.split()
            if words:
                self.keyword_prefix_index[words[0]].append(keyword)

        # Flat list of all patterns for pattern matching
        self._all_patterns_flat = []
        for pl in self.patterns.values():
            self._all_patterns_flat.extend(pl)

    def _load_entities(self, csv_file):
        """
        Load entities from a CSV file.

        Expected columns: 'category', 'entity'. Both are stripped and lowercased.
        Duplicate entities per category are removed.

        Args:
            csv_file (str): Path to the CSV file.

        Returns:
            dict: Mapping from category to list of unique entities.
        """
        entities = defaultdict(list)
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    cat = row.get("category", "").strip().lower()
                    ent = row.get("entity", "").strip().lower()
                    if cat and ent:
                        entities[cat].append(ent)
        except FileNotFoundError:
            print(f"Entities file not found: {csv_file}")
            return defaultdict(list)
        except Exception as e:
            print(f"Error loading entities: {e}")
            return defaultdict(list)
        # Remove duplicates within each category
        for cat in entities:
            entities[cat] = list(set(entities[cat]))
        return dict(entities)

    def _load_keywords(self, csv_file):
        """
        Load keywords from a CSV file (one keyword per row).

        Keywords are stripped, lowercased, and duplicates are removed.

        Args:
            csv_file (str): Path to the CSV file.

        Returns:
            list: Unique keywords.
        """
        keywords = []
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                for row in csv.reader(f):
                    if row and row[0].strip():
                        keywords.append(row[0].strip().lower())
        except FileNotFoundError:
            print(f"Keywords file not found: {csv_file}")
            return []
        except Exception as e:
            print(f"Error loading keywords: {e}")
            return []
        return list(set(keywords))

    def _load_patterns(self, csv_file):
        """
        Load patterns from a CSV file.

        Expected columns: 'type', 'pattern'. Both are stripped and lowercased.
        Patterns are grouped by type.

        Args:
            csv_file (str): Path to the CSV file.

        Returns:
            dict: Mapping from pattern type to list of patterns.
        """
        patterns = defaultdict(list)
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    pt = row.get("type", "").strip().lower()
                    p = row.get("pattern", "").strip().lower()
                    if pt and p:
                        patterns[pt].append(p)
        except FileNotFoundError:
            print(f"Patterns file not found: {csv_file}")
            return defaultdict(list)
        except Exception as e:
            print(f"Error loading patterns: {e}")
            return defaultdict(list)
        return dict(patterns)

    def clean_query(self, query):
        """
        Normalize a query string: lowercase, strip surrounding whitespace,
        and collapse multiple spaces.

        Args:
            query (str): Raw query.

        Returns:
            str: Cleaned query, or empty string if input is falsy.
        """
        if not query:
            return ""
        return " ".join(query.lower().strip().split())

    def generate_suggestions(self, query, max_results=10):
        """
        Generate autocomplete suggestions for a given query.

        Suggestions are produced by applying a series of matcher functions in order.
        Each matcher yields candidate completions that are longer than the original
        query. Duplicates and already-seen suggestions are skipped.

        Results are cached; when the cache exceeds `_cache_max`, the oldest quarter
        of entries are evicted.

        Args:
            query (str): The user's input query.
            max_results (int): Maximum number of suggestions to return.

        Returns:
            list: Up to `max_results` suggestion strings.
        """
        query = self.clean_query(query)
        if not query:
            return []

        cache_key = (query, max_results)
        if cache_key in self._cache:
            return self._cache[cache_key]

        seen = set()
        suggestions = []

        # Ordered list of matcher functions
        matchers = [
            self._multi_word_entity_matches,
            self._direct_matches,
            self._pattern_based_suggestions,
            self._keyword_extension,
            self._entity_completion,
            self._cross_category_suggestions,
        ]

        for matcher in matchers:
            if len(suggestions) >= max_results:
                break
            for s in matcher(query, seen):
                if s not in seen and len(s) > len(query):
                    seen.add(s)
                    suggestions.append(s)
                    if len(suggestions) >= max_results:
                        break

        result = suggestions[:max_results]

        # Simple cache eviction: remove oldest quarter of entries
        if len(self._cache) >= self._cache_max:
            drop = list(self._cache.keys())[: self._cache_max // 4]
            for k in drop:
                del self._cache[k]
        self._cache[cache_key] = result
        return result

    def _direct_matches(self, query, seen):
        """
        Check if the query itself is an entity, keyword, or pattern.

        Args:
            query (str): Cleaned query.
            seen (set): Already yielded suggestions (unused here, but kept for API consistency).

        Returns:
            list: A single-item list containing the query if it matches exactly,
                  otherwise empty.
        """
        matches = []
        if query in self.all_entities_set and query not in seen:
            matches.append(query)
        if query in self.keywords_set and query not in seen:
            matches.append(query)
        for pl in self.patterns.values():
            if query in pl and query not in seen:
                matches.append(query)
                break
        return matches

    def _multi_word_entity_matches(self, query, seen, limit=10):
        """
        Generate suggestions based on entities.

        If the query is an entity, append some action patterns.
        Otherwise, find entities that start with the query.
        Also handle multi-word queries by trying to complete the last word.

        Args:
            query (str): Cleaned query.
            seen (set): Set of already yielded suggestions to avoid duplicates.
            limit (int): Maximum number of suggestions from this matcher.

        Returns:
            list: Entity-based suggestions.
        """
        matches = []
        query_words = query.split()

        # If query is an entity, suggest combining with actions
        if query in self.all_entities_set:
            for action in self.action_patterns[:3]:
                combo = f"{query} {action}"
                if combo not in seen:
                    matches.append(combo)
            return matches

        # Entities starting with the full query
        for entity in self.all_entities:
            if entity.startswith(query) and entity not in seen:
                matches.append(entity)
                if len(matches) >= limit:
                    break

        # Multi-word: treat last word as incomplete entity, prefix as context
        if len(query_words) > 1:
            last_word = query_words[-1]
            prefix = " ".join(query_words[:-1])
            for entity in self.all_entities:
                if entity.startswith(last_word):
                    full_entity = f"{prefix} {entity}"
                    # Avoid suggesting something already in the entity list
                    if full_entity not in seen and full_entity not in self.all_entities_set:
                        matches.append(full_entity)
                        if len(matches) >= limit:
                            break

        return matches

    def _pattern_based_suggestions(self, query, seen):
        """
        Generate suggestions from stored patterns.

        Includes:
            - Patterns that start with the query.
            - Completion of the last word with an action pattern.
            - For question words, completion with question patterns.

        Args:
            query (str): Cleaned query.
            seen (set): Already yielded suggestions.

        Returns:
            list: Pattern-based suggestions.
        """
        matches = []
        query_words = query.split()

        # Patterns that start with the query
        for pattern in self._all_patterns_flat:
            if pattern.startswith(query) and pattern not in seen:
                matches.append(pattern)
                if len(matches) >= 5:
                    break

        if query_words:
            last_word = query_words[-1]
            # Complete last word with an action pattern
            for action in self.action_patterns:
                if action.startswith(last_word):
                    combo = (
                        f"{' '.join(query_words[:-1])} {action}"
                        if len(query_words) > 1
                        else action
                    )
                    if combo not in seen:
                        matches.append(combo)

            # If query starts with a question word, try to complete with a question pattern
            if query_words[0] in ("how", "what", "where", "when", "why", "who"):
                for question in self.question_patterns:
                    if question.startswith(query_words[0]):
                        combo = (
                            f"{question} {' '.join(query_words[1:])}"
                            if len(query_words) > 1
                            else question
                        )
                        if combo not in seen:
                            matches.append(combo)

        return matches

    def _keyword_extension(self, query, seen, limit=5):
        """
        Extend the query by matching the last word against keywords.

        Args:
            query (str): Cleaned query.
            seen (set): Already yielded suggestions.
            limit (int): Maximum number of suggestions.

        Returns:
            list: Keyword-based extensions.
        """
        matches = []
        query_words = query.split()
        if not query_words:
            return matches

        last_word = query_words[-1]
        prefix = " ".join(query_words[:-1])

        for keyword in self.keywords:
            if keyword.startswith(last_word) and keyword != last_word:
                ext = f"{prefix} {keyword}" if prefix else keyword
                if ext not in seen:
                    matches.append(ext)
                    if len(matches) >= limit:
                        break

        return matches

    def _entity_completion(self, query, seen, limit=5):
        """
        Complete the query using the entity prefix index (first word match).

        Args:
            query (str): Cleaned query.
            seen (set): Already yielded suggestions.
            limit (int): Maximum number of suggestions.

        Returns:
            list: Entity completions.
        """
        matches = []
        query_words = query.split()
        if not query_words:
            return matches

        first_word = query_words[0]
        for entity in self.entity_prefix_index.get(first_word, []):
            if entity.startswith(query) and entity not in seen:
                matches.append(entity)
                if len(matches) >= limit:
                    break

        return matches

    def _cross_category_suggestions(self, query, seen):
        """
        If an entity appears in the query, prepend modifiers or append actions.

        This provides suggestions like "<modifier> <entity>" or "<entity> <action>"
        even if the modifier/action is not yet typed.

        Args:
            query (str): Cleaned query.
            seen (set): Already yielded suggestions.

        Returns:
            list: Cross-category suggestions.
        """
        matches = []
        for entity in self.all_entities:
            if entity in query:
                # Append an action if not already present
                for action in self.action_patterns[:2]:
                    if not query.endswith(action):
                        combo = f"{query} {action}"
                        if combo not in seen:
                            matches.append(combo)
                # Prepend a modifier if not already present
                for modifier in self.modifier_patterns[:2]:
                    if not query.startswith(modifier):
                        combo = f"{modifier} {query}"
                        if combo not in seen:
                            matches.append(combo)
                break  # Only consider the first entity found
        return matches


def main():
    """
    Simple interactive command-line interface for the autocomplete engine.
    """
    ac = Autocomplete(
        entities_csv="dataset/entities.csv",
        keywords_csv="dataset/keywords.csv",
        patterns_csv="dataset/patterns.csv",
    )
    print("Autocomplete (Ctrl+C to exit)")
    while True:
        try:
            query = input("\nSearch: ").strip()
            if not query:
                continue
            results = ac.generate_suggestions(query)
            if results:
                for i, s in enumerate(results, 1):
                    print(f"  {i:2d}. {s}")
            else:
                print("No suggestions found")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break


if __name__ == "__main__":
    main()