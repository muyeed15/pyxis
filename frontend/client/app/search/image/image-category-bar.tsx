"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface ImageCategoryBarProps {
  keywords: string[];
  currentQuery: string;
  activeTags: string[];
}

/**
 * Derives a deterministic accent colour for a keyword chip when no thumbnail
 * is available. The colour is stable across renders for the same string.
 */
function stringToColor(str: string): string {
  const palette = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Horizontal scrollable bar that displays:
 *  1. The active search query pill (with a clear button).
 *  2. Active tag pills (each removable via a URL update).
 *  3. Suggestion chips derived from keyword extraction or autocomplete.
 *
 * Suggestion chips use a coloured initial avatar instead of remote thumbnails,
 * which eliminates the 12+ Wikipedia API round-trips that previously blocked
 * the bar from rendering.
 *
 * All navigation is handled through URL params so the parent Server Component
 * re-runs and the Redis-cached API response is reused where possible.
 */
export default function ImageCategoryBar({
  keywords,
  currentQuery,
  activeTags,
}: ImageCategoryBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Builds a URL that adds or removes a tag from the ``tags`` query parameter
   * while preserving all other search params.
   */
  const getTagUrl = (tag: string, action: "add" | "remove"): string => {
    const params = new URLSearchParams(searchParams.toString());
    let next = [...activeTags];

    if (action === "remove") {
      next = next.filter((t) => t !== tag);
    } else if (!next.includes(tag)) {
      next.push(tag);
    }

    if (next.length > 0) {
      params.set("tags", next.join(","));
    } else {
      params.delete("tags");
    }

    if (currentQuery) params.set("q", currentQuery);
    return `/search/image?${params.toString()}`;
  };

  // Filter out the current query and any already-active tags from suggestions,
  // then cap at 12 chips to keep the bar compact.
  const suggestions = keywords
    .filter(
      (k) =>
        k.toLowerCase() !== currentQuery.toLowerCase() &&
        !activeTags.includes(k),
    )
    .slice(0, 12);

  const hasPills = currentQuery || activeTags.length > 0;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      {/* 1. Active query pill */}
      {currentQuery && (
        <div className="flex-shrink-0 flex items-center gap-2 bg-black text-white pl-4 pr-3 py-1 rounded-lg h-[40px] shadow-sm">
          <span className="text-sm font-medium capitalize">{currentQuery}</span>
          <button
            onClick={() => router.push("/search/image")}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            title="Clear search"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* 2. Active tag pills */}
      {activeTags.map((tag, i) => (
        <div
          key={`tag-${i}`}
          className="flex-shrink-0 flex items-center gap-2 bg-black text-white pl-4 pr-3 py-1 rounded-lg h-[40px] shadow-sm animate-in fade-in slide-in-from-left-2"
        >
          <span className="text-sm font-medium capitalize">{tag}</span>
          <Link
            href={getTagUrl(tag, "remove")}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            scroll={false}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>
        </div>
      ))}

      {/* Divider between active pills and suggestions */}
      {hasPills && suggestions.length > 0 && (
        <div className="h-6 w-[1px] bg-gray-200 mx-1 flex-shrink-0" />
      )}

      {/* 3. Suggestion chips – coloured initial avatar, no remote fetch */}
      {suggestions.map((term, i) => (
        <Link
          key={i}
          href={getTagUrl(term, "add")}
          scroll={false}
          className="flex-shrink-0 flex items-center gap-3 pl-1 pr-4 py-1 bg-white border border-gray-200 rounded-lg h-[40px] hover:bg-gray-50 hover:border-gray-300 transition-all group"
        >
          <div
            className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold uppercase"
            style={{ backgroundColor: stringToColor(term) }}
          >
            {term[0]}
          </div>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap capitalize">
            {term}
          </span>
        </Link>
      ))}
    </div>
  );
}
