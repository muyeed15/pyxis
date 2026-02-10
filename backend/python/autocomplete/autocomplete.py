import csv
from collections import defaultdict
import re


class Autocomplete:
    def __init__(self, entities_csv, keywords_csv, patterns_csv):
        """
        Initialize Autocomplete with data from CSV files.

        Args:
            entities_csv: Path to entities CSV file
            keywords_csv: Path to keywords CSV file
            patterns_csv: Path to patterns CSV file
        """
        self.entities = self._load_entities(entities_csv)
        self.keywords = self._load_keywords(keywords_csv)
        self.patterns = self._load_patterns(patterns_csv)

        self._build_index()

    def _build_index(self):
        """Build search indexes from loaded data."""
        self.all_entities = []
        self.entity_to_categories = defaultdict(list)

        for category, entities_list in self.entities.items():
            self.all_entities.extend(entities_list)
            for entity in entities_list:
                self.entity_to_categories[entity].append(category)

        self.all_entities_set = set(self.all_entities)
        self.keywords_set = set(self.keywords)

        self.question_patterns = self.patterns.get("questions", [])
        self.action_patterns = self.patterns.get("actions", [])
        self.modifier_patterns = self.patterns.get("modifiers", [])

        # Build prefix index for faster lookup
        self.entity_prefix_index = defaultdict(list)
        for entity in self.all_entities:
            words = entity.split()
            if words:
                self.entity_prefix_index[words[0]].append(entity)

        # Build keyword prefix index
        self.keyword_prefix_index = defaultdict(list)
        for keyword in self.keywords:
            words = keyword.split()
            if words:
                self.keyword_prefix_index[words[0]].append(keyword)

    def _load_entities(self, csv_file):
        """Load categorized entities from CSV file."""
        entities = defaultdict(list)

        try:
            with open(csv_file, "r", encoding="utf-8") as file:
                reader = csv.DictReader(file)
                for row in reader:
                    category = row.get("category", "").strip().lower()
                    entity = row.get("entity", "").strip().lower()
                    if category and entity:
                        entities[category].append(entity)
        except FileNotFoundError:
            print(f"Entities file not found: {csv_file}")
            return defaultdict(list)
        except Exception as e:
            print(f"Error loading entities: {e}")
            return defaultdict(list)

        for category in entities:
            entities[category] = list(set(entities[category]))

        return dict(entities)

    def _load_keywords(self, csv_file):
        """Load keywords from CSV file."""
        keywords = []
        try:
            with open(csv_file, "r", encoding="utf-8") as file:
                reader = csv.reader(file)
                for row in reader:
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
        """Load search patterns from CSV file."""
        patterns = defaultdict(list)

        try:
            with open(csv_file, "r", encoding="utf-8") as file:
                reader = csv.DictReader(file)
                for row in reader:
                    pattern_type = row.get("type", "").strip().lower()
                    pattern = row.get("pattern", "").strip().lower()
                    if pattern_type and pattern:
                        patterns[pattern_type].append(pattern)
        except FileNotFoundError:
            print(f"Patterns file not found: {csv_file}")
            return defaultdict(list)
        except Exception as e:
            print(f"Error loading patterns: {e}")
            return defaultdict(list)

        return dict(patterns)

    def clean_query(self, query):
        """Normalize query for searching."""
        if not query:
            return ""

        # Lowercase and strip
        query = query.lower().strip()

        # Remove extra whitespace
        query = " ".join(query.split())

        return query

    def generate_suggestions(self, query, max_results=10):
        """Generate autocomplete suggestions for the given query.

        Args:
            query: Search query string
            max_results: Maximum number of suggestions to return

        Returns:
            List of suggestion strings
        """
        query = self.clean_query(query)
        if not query:
            return []

        seen = set()
        suggestions = []

        # Try different matching strategies in order of relevance
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
            new_suggestions = matcher(query, seen)
            for suggestion in new_suggestions:
                if suggestion not in seen and len(suggestion) > len(query):
                    seen.add(suggestion)
                    suggestions.append(suggestion)
                    if len(suggestions) >= max_results:
                        break

        return suggestions[:max_results]

    def _direct_matches(self, query, seen):
        """Exact matches in entities, keywords, or patterns."""
        matches = []

        if query in self.all_entities_set and query not in seen:
            matches.append(query)

        if query in self.keywords_set and query not in seen:
            matches.append(query)

        for pattern_list in self.patterns.values():
            if query in pattern_list and query not in seen:
                matches.append(query)
                break

        return matches

    def _multi_word_entity_matches(self, query, seen, limit=10):
        """Handle multi-word entity matching."""
        matches = []
        query_words = query.split()

        # If query is already a complete entity, suggest extensions
        if query in self.all_entities_set:
            # Extend with patterns
            for action in self.action_patterns[:3]:
                combo = f"{query} {action}"
                if combo not in seen:
                    matches.append(combo)
            return matches

        # Look for entities that start with the query
        for entity in self.all_entities:
            if entity.startswith(query) and entity not in seen:
                matches.append(entity)
                if len(matches) >= limit:
                    break

        # If we have multiple words, try to match the last word as prefix
        if len(query_words) > 1:
            last_word = query_words[-1]
            prefix = " ".join(query_words[:-1])

            # Look for entities that match the pattern: prefix + entity
            for entity in self.all_entities:
                if entity.startswith(last_word) and f"{prefix} {entity}" not in seen:
                    full_entity = f"{prefix} {entity}"
                    if (
                        full_entity not in self.all_entities_set
                    ):  # Only if not already an entity
                        matches.append(full_entity)
                        if len(matches) >= limit:
                            break

        return matches

    def _pattern_based_suggestions(self, query, seen):
        """Generate suggestions based on patterns."""
        matches = []
        query_words = query.split()

        # Check if query matches the beginning of any pattern
        all_patterns = []
        for pattern_list in self.patterns.values():
            all_patterns.extend(pattern_list)

        for pattern in all_patterns:
            if pattern.startswith(query) and pattern not in seen:
                matches.append(pattern)
                if len(matches) >= 5:
                    break

        # Combine query with patterns if query looks like an entity
        if query_words:
            # Try to match last word with action patterns
            last_word = query_words[-1]
            for action in self.action_patterns:
                if action.startswith(last_word):
                    if len(query_words) > 1:
                        prefix = " ".join(query_words[:-1])
                        combo = f"{prefix} {action}"
                    else:
                        combo = action
                    if combo not in seen:
                        matches.append(combo)

            # Try question patterns
            if query_words[0] in ["how", "what", "where", "when", "why", "who"]:
                for question in self.question_patterns:
                    if question.startswith(query_words[0]):
                        if len(query_words) > 1:
                            rest = " ".join(query_words[1:])
                            combo = f"{question} {rest}"
                        else:
                            combo = question
                        if combo not in seen:
                            matches.append(combo)

        return matches

    def _keyword_extension(self, query, seen, limit=5):
        """Extend query with keywords."""
        matches = []
        query_words = query.split()

        if not query_words:
            return matches

        # Try to extend with keywords that start with the last word
        last_word = query_words[-1]
        for keyword in self.keywords:
            if keyword.startswith(last_word) and keyword != last_word:
                if len(query_words) > 1:
                    prefix = " ".join(query_words[:-1])
                    extension = f"{prefix} {keyword}"
                else:
                    extension = keyword
                if extension not in seen:
                    matches.append(extension)
                    if len(matches) >= limit:
                        break

        return matches

    def _entity_completion(self, query, seen, limit=5):
        """Complete partial entity names."""
        matches = []
        query_words = query.split()

        if not query_words:
            return matches

        # Use prefix index for faster lookup
        first_word = query_words[0]
        if first_word in self.entity_prefix_index:
            for entity in self.entity_prefix_index[first_word]:
                if entity.startswith(query) and entity not in seen:
                    matches.append(entity)
                    if len(matches) >= limit:
                        break

        return matches

    def _cross_category_suggestions(self, query, seen):
        """Suggest combinations across categories."""
        matches = []
        query_words = query.split()

        if not query_words:
            return matches

        # If query contains an entity, suggest related actions/modifiers
        for entity in self.all_entities:
            if entity in query:
                # Already have this entity, suggest actions
                for action in self.action_patterns[:2]:
                    if not query.endswith(action):
                        combo = f"{query} {action}"
                        if combo not in seen:
                            matches.append(combo)

                # Suggest modifiers
                for modifier in self.modifier_patterns[:2]:
                    if not query.startswith(modifier):
                        combo = f"{modifier} {query}"
                        if combo not in seen:
                            matches.append(combo)
                break

        return matches


def main():
    autocomplete = Autocomplete(
        entities_csv="dataset/entities.csv",
        keywords_csv="dataset/keywords.csv",
        patterns_csv="dataset/patterns.csv",
    )

    print("Autocomplete System (Ctrl+C to exit)")
    print("-" * 40)

    while True:
        try:
            query = input("\nSearch: ").strip()
            if not query:
                continue

            results = autocomplete.generate_suggestions(query)

            if results:
                print(f"Suggestions ({len(results)}):")
                for i, phrase in enumerate(results, 1):
                    print(f"  {i:2d}. {phrase}")
            else:
                print("No suggestions found")

        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except EOFError:
            print("\nExiting...")
            break


if __name__ == "__main__":
    main()
