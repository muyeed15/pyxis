import csv
from collections import defaultdict
from functools import lru_cache


class Autocomplete:
    def __init__(self, entities_csv, keywords_csv, patterns_csv):
        self.entities = self._load_entities(entities_csv)
        self.keywords = self._load_keywords(keywords_csv)
        self.patterns = self._load_patterns(patterns_csv)
        self._build_index()
        # Result cache: (query, max_results) -> list
        self._cache: dict = {}
        self._cache_max = 512

    def _build_index(self):
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

        # Prefix indexes for O(1) first-word lookup
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
        for cat in entities:
            entities[cat] = list(set(entities[cat]))
        return dict(entities)

    def _load_keywords(self, csv_file):
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
        if not query:
            return ""
        return " ".join(query.lower().strip().split())

    def generate_suggestions(self, query, max_results=10):
        query = self.clean_query(query)
        if not query:
            return []

        cache_key = (query, max_results)
        if cache_key in self._cache:
            return self._cache[cache_key]

        seen = set()
        suggestions = []

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

        if len(self._cache) >= self._cache_max:
            # Evict oldest quarter
            drop = list(self._cache.keys())[: self._cache_max // 4]
            for k in drop:
                del self._cache[k]
        self._cache[cache_key] = result
        return result

    def _direct_matches(self, query, seen):
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
        matches = []
        query_words = query.split()

        if query in self.all_entities_set:
            for action in self.action_patterns[:3]:
                combo = f"{query} {action}"
                if combo not in seen:
                    matches.append(combo)
            return matches

        for entity in self.all_entities:
            if entity.startswith(query) and entity not in seen:
                matches.append(entity)
                if len(matches) >= limit:
                    break

        if len(query_words) > 1:
            last_word = query_words[-1]
            prefix = " ".join(query_words[:-1])
            for entity in self.all_entities:
                if entity.startswith(last_word):
                    full_entity = f"{prefix} {entity}"
                    if full_entity not in seen and full_entity not in self.all_entities_set:
                        matches.append(full_entity)
                        if len(matches) >= limit:
                            break

        return matches

    def _pattern_based_suggestions(self, query, seen):
        matches = []
        query_words = query.split()

        for pattern in self._all_patterns_flat:
            if pattern.startswith(query) and pattern not in seen:
                matches.append(pattern)
                if len(matches) >= 5:
                    break

        if query_words:
            last_word = query_words[-1]
            for action in self.action_patterns:
                if action.startswith(last_word):
                    combo = (
                        f"{' '.join(query_words[:-1])} {action}"
                        if len(query_words) > 1
                        else action
                    )
                    if combo not in seen:
                        matches.append(combo)

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
        matches = []
        for entity in self.all_entities:
            if entity in query:
                for action in self.action_patterns[:2]:
                    if not query.endswith(action):
                        combo = f"{query} {action}"
                        if combo not in seen:
                            matches.append(combo)
                for modifier in self.modifier_patterns[:2]:
                    if not query.startswith(modifier):
                        combo = f"{modifier} {query}"
                        if combo not in seen:
                            matches.append(combo)
                break
        return matches


def main():
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