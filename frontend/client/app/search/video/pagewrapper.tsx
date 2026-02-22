'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import type { APIResponse, VideoSearchResultItem } from '../../types';
import SearchHeader from '../../components/searchheader';
import VideoResultsList from './video';

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

export default function PageWrapper({ data: initialData, errorMessage: initialError, query }: PageWrapperProps) {
  const videosKey = query
    ? `/api/search?q=${encodeURIComponent(query)}&type=videos&max_results=30`
    : null;

  const retryCountRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    retryCountRef.current = 0;
    setExhausted(false);
  }, [videosKey]);

  const { data, error } = useSWR<APIResponse>(
    videosKey,
    fetcher,
    {
      fallbackData: initialData || undefined,
      revalidateOnMount: !initialData,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
      shouldRetryOnError: true,
      onErrorRetry: (_, _key, _config, revalidate, { retryCount }) => {
        retryCountRef.current = retryCount;
        if (retryCount >= MAX_RETRIES) { setExhausted(true); return; }
        setTimeout(() => revalidate({ retryCount }), 2000);
      },
    }
  );

  const showLoadingState = !data && !exhausted;
  const showFatalError = exhausted && !data;

  const fullResults = (data?.results as VideoSearchResultItem[]) || [];
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [observerTarget, setObserverTarget] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(20);
    setIsLoadingMore(false);
  }, [query]);

  useEffect(() => {
    if (!observerTarget) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && visibleCount < fullResults.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 20, fullResults.length));
            setIsLoadingMore(false);
          }, 600);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [observerTarget, isLoadingMore, visibleCount, fullResults.length]);

  const currentVisibleResults = fullResults.slice(0, visibleCount);

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
                  <VideoResultsList results={currentVisibleResults} isLoading={false} />
                  {visibleCount < fullResults.length && (
                    <div ref={setObserverTarget} className="flex justify-center pb-12 pt-4 h-20 w-full">
                      {isLoadingMore && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                      )}
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