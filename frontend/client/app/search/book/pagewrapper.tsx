"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import type { APIResponse, BookSearchResultItem, AutocompleteData } from "../../types";
import SearchHeader from "../../components/searchheader";
import BookResultsList from "./book";
import RelatedSearches from "../../components/relatedsearches";

const BOOK_MAX_PAGES = 10;
const MAX_RETRIES = 20;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

interface PageWrapperProps {
  data: APIResponse | null;
  relatedKeywords: string[];
  errorMessage: string | null;
  query: string;
}

export default function PageWrapper({
  data: initialData,
  relatedKeywords: initialKeywords,
  errorMessage,
  query,
}: PageWrapperProps) {
   const bookKey = query ? `/api/search?q=${encodeURIComponent(query)}&type=books&page=1` : null;
  const autocompleteKey = query ? `/api/autocomplete?q=${encodeURIComponent(query)}` : null;

  const retryCountRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    retryCountRef.current = 0;
    setExhausted(false);
    setAllResults((initialData?.results as BookSearchResultItem[]) || []);
    setCurrentPage(1);
    setHasMore(initialData?.has_more ?? false);
    setLoadingMore(false);
    setLoadMoreError(false);
  }, [query, initialData]);

  const { data: bookData } = useSWR<APIResponse>(bookKey, fetcher, {
    fallbackData: initialData || undefined,
    revalidateOnMount: !initialData,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: true,
    onErrorRetry: (_, _key, _config, revalidate, { retryCount }) => {
      retryCountRef.current = retryCount;
      if (retryCount >= MAX_RETRIES) {
        setExhausted(true);
        return;
      }
      setTimeout(() => revalidate({ retryCount }), 2000);
    },
  });

  const { data: autocompleteData } = useSWR<AutocompleteData>(
    autocompleteKey,
    fetcher,
    {
      fallbackData: initialKeywords.length > 0 ? { suggestions: initialKeywords } : undefined,
      revalidateOnMount: !initialKeywords.length,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      dedupingInterval: 300000,
      shouldRetryOnError: false,
    }
  );

  const [allResults, setAllResults] = useState<BookSearchResultItem[]>(
    (initialData?.results as BookSearchResultItem[]) || []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  useEffect(() => {
    if (bookData && currentPage === 1) {
      setAllResults((bookData.results as BookSearchResultItem[]) || []);
      setHasMore(bookData.has_more ?? false);
    }
  }, [bookData, currentPage]);

  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    if (nextPage > BOOK_MAX_PAGES || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLoadMoreError(false);

    let attempt = 0;
    let success = false;

    while (attempt < 3 && !success) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=books&page=${nextPage}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data: APIResponse = await res.json();
        
        setAllResults((prev) => [...prev, ...(data.results as BookSearchResultItem[])]);
        setCurrentPage(nextPage);
        setHasMore((data.has_more ?? false) && nextPage < BOOK_MAX_PAGES);
        success = true;
      } catch (error) {
        attempt++;
        if (attempt === 3) setLoadMoreError(true);
        else await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    setLoadingMore(false);
  }, [currentPage, hasMore, loadingMore, query]);

  const related = autocompleteData?.suggestions || initialKeywords;
  const showLoadingState = !bookData && !initialData && !exhausted;
  const showFatalError = exhausted && !bookData && !initialData;

  return (
    <div className="min-h-screen bg-white"> {/* Slightly darker background to make white cards pop */}
      <SearchHeader />

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        {related.length > 0 && (
          <div className="mb-8">
            <RelatedSearches keywords={related} currentQuery={query} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {showFatalError ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-red-600">
              <p className="font-semibold">Something went wrong</p>
              <p className="text-sm opacity-80">Please try again later.</p>
            </div>
          ) : showLoadingState ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          ) : (
            <>
              <BookResultsList results={allResults} />

              {loadMoreError && (
                <p className="mt-8 text-sm text-gray-500 text-center italic">
                  Nothing new right now
                </p>
              )}

              {hasMore && (
                <div className="mt-12 mb-12 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full max-w-[300px] py-3 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-full transition-colors border border-gray-200 shadow-sm"
                  >
                    {loadingMore ? "Loading..." : "Show More Books"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}