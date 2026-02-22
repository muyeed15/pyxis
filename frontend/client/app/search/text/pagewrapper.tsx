"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import type {
  APIResponse,
  TextSearchResultItem,
  AutocompleteData,
} from "../../types";
import SearchHeader from "../../components/searchheader";
import TextResultsList from "./text";
import InstantAnswer from "../../components/instantanswer";
import RelatedSearches from "../../components/relatedsearches";

const TEXT_MAX_PAGES = 10;

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
        <div className="w-full h-32 bg-gray-100 animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse" />
        </div>
      </div>
      <div className="p-4 border border-gray-100 rounded-lg bg-gray-50 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

interface PageWrapperProps {
  data: APIResponse | null;
  relatedKeywords: string[];
  errorMessage: string | null;
  query: string;
  instantAnswer: any;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const MAX_RETRIES = 20;

export default function PageWrapper({
  data: initialData,
  relatedKeywords: initialKeywords,
  errorMessage: initialError,
  query,
  instantAnswer: initialInstantAnswer,
}: PageWrapperProps) {
  const instantKey = query
    ? `/api/instant?q=${encodeURIComponent(query)}`
    : null;
  const autocompleteKey = query
    ? `/api/autocomplete?q=${encodeURIComponent(query)}`
    : null;
  const textKey = query
    ? `/api/search?q=${encodeURIComponent(query)}&type=text&page=1`
    : null;

  const retryCountRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    retryCountRef.current = 0;
    setExhausted(false);
    setAllResults((initialData?.results as TextSearchResultItem[]) || []);
    setCurrentPage(1);
    setHasMore(initialData?.has_more ?? false);
    setLoadingMore(false);
    setLoadMoreError(false);
  }, [query, initialData]);

  const { data: textData } = useSWR<APIResponse>(textKey, fetcher, {
    fallbackData: initialData || undefined,
    revalidateOnMount: !initialData,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
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

  const { data: instantData } = useSWR(instantKey, fetcher, {
    fallbackData: initialInstantAnswer || undefined,
    revalidateOnMount: !initialInstantAnswer,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  });

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
      dedupingInterval: 300000,
      shouldRetryOnError: false,
    },
  );

  const [allResults, setAllResults] = useState<TextSearchResultItem[]>(
    (initialData?.results as TextSearchResultItem[]) || [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  useEffect(() => {
    if (textData && currentPage === 1) {
      setAllResults((textData.results as TextSearchResultItem[]) || []);
      setHasMore(textData.has_more ?? false);
    }
  }, [textData, currentPage]);

  // --------------------------------------------------------------------------
  // loadMore with automatic retries (exponential backoff)
  // --------------------------------------------------------------------------
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    if (nextPage > TEXT_MAX_PAGES || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLoadMoreError(false);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=text&page=${nextPage}`,
        );
        if (!res.ok) throw new Error(`${res.status}`);
        const data: APIResponse = await res.json();
        const newResults = (data.results as TextSearchResultItem[]) || [];

        setAllResults((prev) => [...prev, ...newResults]);
        setCurrentPage(nextPage);
        setHasMore((data.has_more ?? false) && nextPage < TEXT_MAX_PAGES);
        success = true; // exit loop
      } catch (error) {
        attempt++;
        if (attempt === maxRetries) {
          setLoadMoreError(true);
        } else {
          // wait before retrying (1s, 2s, 4s)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt)),
          );
        }
      }
    }

    setLoadingMore(false);
  }, [currentPage, hasMore, loadingMore, query]);

  const related = autocompleteData?.suggestions || initialKeywords;
  const activeInstantAnswer = instantData || initialInstantAnswer;

  const showLoadingState = !textData && !initialData && !exhausted;
  const showFatalError = exhausted && !textData && !initialData;
  const showSidebarContent = !!(activeInstantAnswer || related.length);

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-10">
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
                <TextResultsList results={allResults} />

                {loadMoreError && (
                  <p className="mt-6 text-sm text-gray-500 text-center italic">
                    Nothing new right now
                  </p>
                )}

                {hasMore && (
                  <div className="mt-8 mb-12 max-w-[680px]">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full py-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg transition-colors border border-gray-200"
                    >
                      {loadingMore ? (
                        <span className="flex items-center justify-center gap-2">
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
              </>
            )}
          </div>

          <div className="hidden lg:block w-[350px] shrink-0 space-y-6">
            {showSidebarContent ? (
              <>
                {activeInstantAnswer && !activeInstantAnswer.error && (
                  <InstantAnswer
                    answer={activeInstantAnswer.answer}
                    imageUrl={activeInstantAnswer.image_url}
                    query={query}
                  />
                )}
                {related.length > 0 && (
                  <RelatedSearches keywords={related} currentQuery={query} />
                )}
              </>
            ) : !showFatalError && showLoadingState ? (
              <SidebarSkeleton />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
