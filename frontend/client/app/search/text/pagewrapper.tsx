'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import type { APIResponse, TextSearchResultItem, AutocompleteData } from '../../types';
import SearchHeader from '../../components/searchheader';
import TextResultsList from './text';
import InstantAnswer from '../../components/instantanswer';
import RelatedSearches from '../../components/relatedsearches';

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
  const textKey = query
    ? `/api/search?q=${encodeURIComponent(query)}&type=text&max_results=50&safesearch=on`
    : null;
  const instantKey = query ? `/api/instant?q=${encodeURIComponent(query)}` : null;
  const autocompleteKey = query ? `/api/autocomplete?q=${encodeURIComponent(query)}` : null;

  const retryCountRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    retryCountRef.current = 0;
    setExhausted(false);
  }, [textKey]);

  const { data: textData } = useSWR<APIResponse>(
    textKey,
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

  const { data: instantData } = useSWR(
    instantKey,
    fetcher,
    {
      fallbackData: initialInstantAnswer || undefined,
      revalidateOnMount: !initialInstantAnswer,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
      shouldRetryOnError: false,
    }
  );

  const { data: autocompleteData } = useSWR<AutocompleteData>(
    autocompleteKey,
    fetcher,
    {
      fallbackData: initialKeywords.length > 0 ? { suggestions: initialKeywords } : undefined,
      revalidateOnMount: !initialKeywords.length,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
      shouldRetryOnError: false,
    }
  );

  const data = textData || initialData;
  const related = autocompleteData?.suggestions || initialKeywords;
  const activeInstantAnswer = instantData || initialInstantAnswer;

  const showLoadingState = !data && !exhausted;
  const showFatalError = exhausted && !data;

  const results = (data?.results as TextSearchResultItem[]) || [];
  const [visibleCount, setVisibleCount] = useState(10);
  const currentVisibleResults = results.slice(0, visibleCount);

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
                <TextResultsList results={currentVisibleResults} />
                {visibleCount < results.length && (
                  <div className="mt-8 mb-12 max-w-[650px]">
                    <button
                      onClick={() => setVisibleCount((p) => Math.min(p + 10, results.length))}
                      className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200"
                    >
                      Show More Results
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