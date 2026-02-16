'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import type { APIResponse, TextSearchResultItem } from '../../types';
import TextResultsList from './text';
import SearchHeader from '../../components/searchheader';
import InstantAnswer from '../../components/instantanswer';
import RelatedSearches from '../../components/relatedsearches';

interface PageWrapperProps {
  data: APIResponse | null;
  instantAnswer: { answer: string; image_url: string | null } | null;
  relatedKeywords: string[];
  errorMessage: string | null;
  query: string;
}

interface InstantAnswerData {
  answer: string;
  image_url: string | null;
}

interface AutocompleteData {
  suggestions: string[];
}

export default function PageWrapper({
  data: initialData,
  instantAnswer: initialInstantAnswer,
  relatedKeywords: initialKeywords,
  errorMessage: initialError,
  query,
}: PageWrapperProps) {
  
  // SWR keys for caching
  const textSearchKey = query 
    ? `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/search?q=${encodeURIComponent(query)}&type=text&max_results=30`
    : null;
  
  const instantAnswerKey = query
    ? `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/instant?q=${encodeURIComponent(query)}`
    : null;

  const autocompleteKey = query
    ? `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/autocomplete?q=${encodeURIComponent(query)}&max_results=8`
    : null;

  // Aggressive SWR caching with optimistic updates
  const { data: textData, error: textError } = useSWR<APIResponse>(
    textSearchKey,
    { 
      fallbackData: initialData || undefined,
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
      focusThrottleInterval: 300000,
    }
  );

  const { data: instantData } = useSWR<InstantAnswerData>(
    instantAnswerKey,
    { 
      fallbackData: initialInstantAnswer || undefined,
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  );

  const { data: autocompleteData } = useSWR<AutocompleteData>(
    autocompleteKey,
    { 
      fallbackData: initialKeywords.length > 0 ? { suggestions: initialKeywords } : undefined,
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  );

  const data = textData || initialData;
  const instantAnswer = instantData || initialInstantAnswer;
  const relatedKeywords = autocompleteData?.suggestions || initialKeywords;
  const errorMessage = textError?.message || initialError;

  const fullResults = (data?.results as TextSearchResultItem[]) || [];
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
  }, [query]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 10, fullResults.length));
  };

  const currentVisibleResults = fullResults.slice(0, visibleCount);

  // Show loading only if we have no data at all
  const showLoading = !data && !textError;

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />

      <AnimatePresence mode="wait">
        {showLoading ? (
           <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-10"
          >
             <div className="w-full h-40 bg-gray-100 animate-pulse rounded-md"></div>
          </motion.div>
        ) : (
          <motion.main
            key={query} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-10"
          >
            <div className="flex-1 max-w-[650px]">
              {errorMessage ? (
                <div className="text-red-500">Error: {errorMessage}</div>
              ) : (
                <>
                  <TextResultsList results={currentVisibleResults} />

                  {visibleCount < fullResults.length && (
                    <div className="mt-8 mb-12">
                      <button
                        onClick={handleLoadMore}
                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                      >
                        Show More Results
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="hidden lg:block w-[350px] shrink-0 space-y-4">
              {instantAnswer && (
                <InstantAnswer
                  answer={instantAnswer.answer}
                  imageUrl={instantAnswer.image_url}
                  query={query}
                />
              )}
              <RelatedSearches keywords={relatedKeywords} currentQuery={query} />
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}