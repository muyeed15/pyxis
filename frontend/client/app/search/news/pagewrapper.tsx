"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import type { APIResponse, NewsSearchResultItem, AutocompleteData } from "../../types";
import SearchHeader from "../../components/searchheader";
import RelatedSearches from "../../components/relatedsearches";
import NewsResultsList from "./news";

const NEWS_MAX_PAGES = 10;

interface NewsPageWrapperProps {
  data: APIResponse | null;
  relatedKeywords: string[];
  errorMessage: string | null;
  query: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

export default function NewsPageWrapper({
  data: initialData,
  relatedKeywords: initialKeywords,
  errorMessage: initialError,
  query,
}: NewsPageWrapperProps) {
  const newsKey = query ? `/api/search?q=${encodeURIComponent(query)}&type=news&page=1` : null;
  const autocompleteKey = query ? `/api/autocomplete?q=${encodeURIComponent(query)}` : null;

  const [allResults, setAllResults] = useState<NewsSearchResultItem[]>(
    (initialData?.results as NewsSearchResultItem[]) || []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setAllResults((initialData?.results as NewsSearchResultItem[]) || []);
    setCurrentPage(1);
    setHasMore(initialData?.has_more ?? false);
    setLoadingMore(false);
  }, [query, initialData]);

  const { data: newsData, error: newsError } = useSWR<APIResponse>(newsKey, fetcher, {
    fallbackData: initialData || undefined,
    revalidateOnMount: !initialData,
    revalidateOnFocus: false,
  });

  const { data: autocompleteData } = useSWR<AutocompleteData>(autocompleteKey, fetcher, {
    fallbackData: initialKeywords.length > 0 ? { suggestions: initialKeywords } : undefined,
    revalidateOnMount: !initialKeywords.length,
    revalidateOnFocus: false,
  });

  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    if (nextPage > NEWS_MAX_PAGES || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=news&page=${nextPage}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: APIResponse = await res.json();
      const newResults = (data.results as NewsSearchResultItem[]) || [];

      setAllResults((prev) => [...prev, ...newResults]);
      setCurrentPage(nextPage);
      setHasMore((data.has_more ?? false) && nextPage < NEWS_MAX_PAGES);
    } catch (error) {
      console.error("Failed to load more news", error);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, query]);

  const related = autocompleteData?.suggestions || initialKeywords;
  
  const showLoadingState = !newsData && !initialData && !newsError && !initialError;
  const hasFatalError = (!initialData && newsError) || initialError || (newsData && (newsData as any).error);

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 min-w-0">
            {showLoadingState ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            ) : hasFatalError ? (
              <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-red-600 max-w-[680px]">
                <p className="font-semibold">News temporarily unavailable</p>
                <p className="text-sm opacity-80 mt-1">
                  We've hit a search provider limit. Please wait a moment and try refreshing the page.
                </p>
              </div>
            ) : (
              <>
                <NewsResultsList results={allResults} />

                {hasMore && (
                  <div className="mt-8 mb-12 max-w-[780px]">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full py-4 bg-zinc-50 hover:bg-zinc-100/80 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-800 font-semibold tracking-wide rounded-3xl transition-colors duration-300 border border-zinc-100"
                    >
                      {loadingMore ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                        </span>
                      ) : (
                        "Show More Latest News"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:block w-[300px] shrink-0 space-y-6">
            {related.length > 0 && !hasFatalError && (
              <RelatedSearches keywords={related} currentQuery={query} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}