"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import type {
  APIResponse,
  ImageSearchResultItem,
  AutocompleteData,
} from "../../types";
import SearchHeader from "../../components/searchheader";
import ImageResultsList, { SidePanel } from "./image";
import ImageCategoryBar from "./image-category-bar";

interface PageWrapperProps {
  data: APIResponse | null;
  relatedKeywords: string[];
  errorMessage: string | null;
  query: string;
  tags: string[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const MAX_RETRIES = 20;
const PANEL_WIDTH = 488; // Updated to match image.tsx
const IMAGE_RESULTS_PER_PAGE = 20;
const IMAGE_MAX_PAGES = 10;

export default function PageWrapper({
  data: initialData,
  relatedKeywords: initialKeywords,
  errorMessage: initialError,
  query,
  tags,
}: PageWrapperProps) {
  const combinedSearchQuery = [query, ...tags].join(" ").trim();

  const imagesKey = combinedSearchQuery
    ? `/api/search?q=${encodeURIComponent(combinedSearchQuery)}&type=images&max_results=${IMAGE_RESULTS_PER_PAGE}&page=1`
    : null;
  const autocompleteKey = combinedSearchQuery
    ? `/api/autocomplete?q=${encodeURIComponent(combinedSearchQuery)}`
    : null;

  // --------------------------------------------------------------------------
  // Pagination state
  // --------------------------------------------------------------------------
  const [allResults, setAllResults] = useState<ImageSearchResultItem[]>(
    (initialData?.results as ImageSearchResultItem[]) || [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  // --------------------------------------------------------------------------
  // Panel state
  // --------------------------------------------------------------------------
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // --------------------------------------------------------------------------
  // SWR retry tracking
  // --------------------------------------------------------------------------
  const retryCountRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);

  // --------------------------------------------------------------------------
  // Reset everything when the query changes.
  // --------------------------------------------------------------------------
  useEffect(() => {
    retryCountRef.current = 0;
    setExhausted(false);
    setSelectedIndex(null);
    setAllResults((initialData?.results as ImageSearchResultItem[]) || []);
    setCurrentPage(1);
    setHasMore(initialData?.has_more ?? false);
    setLoadingMore(false);
    setLoadMoreError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedSearchQuery]);

  // --------------------------------------------------------------------------
  // Data fetching – images
  // --------------------------------------------------------------------------
  const { data: imagesData } = useSWR<APIResponse>(imagesKey, fetcher, {
    fallbackData: initialData || undefined,
    revalidateOnMount: !initialData,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300_000,
    shouldRetryOnError: true,
    onErrorRetry: (_, _key, _cfg, revalidate, { retryCount }) => {
      retryCountRef.current = retryCount;
      if (retryCount >= MAX_RETRIES) {
        setExhausted(true);
        return;
      }
      setTimeout(() => revalidate({ retryCount }), 2000);
    },
  });

  // Sync SWR page-1 data into local state (page-2+ is handled by loadMore).
  useEffect(() => {
    if (!imagesData) return;
    setAllResults((imagesData.results as ImageSearchResultItem[]) || []);
    setHasMore(imagesData.has_more ?? false);
    setCurrentPage(1);
  }, [imagesData]);

  // --------------------------------------------------------------------------
  // Data fetching – autocomplete
  // --------------------------------------------------------------------------
  const { data: autocompleteData } = useSWR<AutocompleteData>(
    autocompleteKey,
    fetcher,
    {
      fallbackData:
        initialKeywords.length > 0
          ? { suggestions: initialKeywords }
          : undefined,
      revalidateOnMount: !initialKeywords.length,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300_000,
      shouldRetryOnError: false,
    },
  );

  const relatedKeywords = autocompleteData?.suggestions || initialKeywords;

  // --------------------------------------------------------------------------
  // Derived UI flags
  // --------------------------------------------------------------------------
  const showLoadingState = !imagesData && !exhausted;
  const showFatalError = exhausted && !imagesData;

  // --------------------------------------------------------------------------
  // Pagination – load next page with automatic retries (exponential backoff)
  // --------------------------------------------------------------------------
  const loadMore = async () => {
    const nextPage = currentPage + 1;
    if (nextPage > IMAGE_MAX_PAGES || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLoadMoreError(false);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(combinedSearchQuery)}&type=images&max_results=${IMAGE_RESULTS_PER_PAGE}&page=${nextPage}`,
        );
        if (!res.ok) throw new Error(`${res.status}`);
        const pageData: APIResponse = await res.json();
        const newResults = (pageData.results as ImageSearchResultItem[]) || [];
        setAllResults((prev) => [...prev, ...newResults]);
        setCurrentPage(nextPage);
        setHasMore(pageData.has_more ?? false);
        success = true; // exit loop
      } catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          setLoadMoreError(true);
        } else {
          // wait before retrying (exponential backoff: 1s, 2s, 4s)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt)),
          );
        }
      }
    }

    setLoadingMore(false);
  };

  // --------------------------------------------------------------------------
  // Category bar keywords
  // --------------------------------------------------------------------------
  const displayCategories = useMemo(() => {
    if (allResults.length === 0) return relatedKeywords;

    const stopWords = new Set([
      "the", "and", "a", "an", "of", "in", "for", "on", "with", "by", "at",
      "to", "from", "is", "it", "that", "this", "your", "best", "choose",
      "thrives", "environment", "climate", "wallpapers", "images", "pictures",
      "photos", "hd", "4k", "background", "download", "free", "stock",
      "photo", "image", "picture", "desktop", "phone", "mobile", "screen",
      "full", "size", "view", "about", "review", "top", "quality", "high",
      "resolution", "get", "make", "how", "what", "when", "where",
    ]);
    query
      .toLowerCase()
      .split(" ")
      .forEach((w) => stopWords.add(w));
    tags.forEach((t) => stopWords.add(t.toLowerCase()));

    const counts: Record<string, number> = {};
    allResults.forEach((item) => {
      item.title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .split(/\s+/)
        .forEach((word) => {
          if (word.length > 3 && !stopWords.has(word)) {
            counts[word] = (counts[word] || 0) + 1;
          }
        });
    });

    const top = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

    return top.length > 0 ? top : relatedKeywords;
  }, [allResults, query, relatedKeywords, tags]);

  const isPanelOpen = selectedIndex !== null;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />

      <AnimatePresence mode="wait">
        <motion.main
          key={combinedSearchQuery}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className={`max-w-[1600px] mx-auto px-4 md:px-6 py-4 transition-all duration-300 ${
            isPanelOpen ? "lg:mr-[488px]" : ""
          }`}
        >
          {!showLoadingState &&
            !showFatalError &&
            (displayCategories.length > 0 || tags.length > 0) && (
              <div className="mb-5 -mx-4 px-4 md:mx-0 md:px-0">
                <ImageCategoryBar
                  keywords={displayCategories}
                  currentQuery={query}
                  activeTags={tags}
                />
              </div>
            )}

          {showFatalError ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-center">
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm opacity-70 mt-1">Please try again later.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {isPanelOpen && selectedIndex !== null && (
                  <SidePanel
                    results={allResults}
                    index={selectedIndex}
                    onClose={() => setSelectedIndex(null)}
                    onPrev={() =>
                      setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i))
                    }
                    onNext={() =>
                      setSelectedIndex((i) =>
                        i !== null && i < allResults.length - 1 ? i + 1 : i,
                      )
                    }
                  />
                )}
              </AnimatePresence>

              <ImageResultsList
                results={allResults}
                isLoading={showLoadingState}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />

              {loadMoreError && (
                <p className="text-sm text-gray-500 text-center italic">
                  Nothing new right now
                </p>
              )}

              {hasMore && !showLoadingState && (
                <div className="mt-4 mb-8 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg transition-colors border border-gray-200"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      </span>
                    ) : (
                      "Show More Results"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}