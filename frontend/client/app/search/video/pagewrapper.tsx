"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import type { APIResponse, VideoSearchResultItem } from "../../types";
import SearchHeader from "../../components/searchheader";
import VideoResultsList from "./video";

interface PageWrapperProps {
  data: APIResponse | null;
  errorMessage: string | null;
  query: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

const MAX_RETRIES = 20;
const VIDEO_RESULTS_PER_PAGE = 20;
const VIDEO_MAX_PAGES = 10;

export default function PageWrapper({
  data: initialData,
  errorMessage: initialError,
  query,
}: PageWrapperProps) {
  const videosKey = query
    ? `/api/search?q=${encodeURIComponent(query)}&type=videos&max_results=${VIDEO_RESULTS_PER_PAGE}&page=1`
    : null;

  const retryCountRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);

  // Pagination state
  const [allResults, setAllResults] = useState<VideoSearchResultItem[]>(
    (initialData?.results as VideoSearchResultItem[]) || [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  useEffect(() => {
    retryCountRef.current = 0;
    setExhausted(false);
    setAllResults((initialData?.results as VideoSearchResultItem[]) || []);
    setCurrentPage(1);
    setHasMore(initialData?.has_more ?? false);
    setLoadingMore(false);
    setLoadMoreError(false);
  }, [query, initialData]);

  const { data: videoData } = useSWR<APIResponse>(videosKey, fetcher, {
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

  useEffect(() => {
    if (videoData && currentPage === 1) {
      setAllResults((videoData.results as VideoSearchResultItem[]) || []);
      setHasMore(videoData.has_more ?? false);
    }
  }, [videoData, currentPage]);

  const loadMore = async () => {
    const nextPage = currentPage + 1;
    if (nextPage > VIDEO_MAX_PAGES || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLoadMoreError(false);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=videos&max_results=${VIDEO_RESULTS_PER_PAGE}&page=${nextPage}`,
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data: APIResponse = await res.json();
      const newResults = (data.results as VideoSearchResultItem[]) || [];

      setAllResults((prev) => [...prev, ...newResults]);
      setCurrentPage(nextPage);
      setHasMore(data.has_more ?? false);
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const showLoadingState = !videoData && !initialData && !exhausted;
  const showFatalError = exhausted && !videoData && !initialData;

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />
      <AnimatePresence mode="wait">
        <motion.main
          key={query}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="max-w-[1600px] mx-auto px-4 md:px-6 py-6"
        >
          {showFatalError ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-red-600 text-center">
              <p>Something went wrong</p>
              <p className="text-sm opacity-80">Please try again later.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {showLoadingState ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              ) : (
                <>
                  <VideoResultsList results={allResults} isLoading={false} />

                  {loadMoreError && (
                    <p className="text-sm text-gray-500 text-center italic">
                      Nothing new right now
                    </p>
                  )}

                  {hasMore && (
                    <div className="flex justify-center mt-4 mb-8">
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
                </>
              )}
            </div>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
