'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { APIResponse } from './types';
import TextResultsList from './text';
import SearchHeader from '../../components/searchheader';
import Pagination from '../../components/pagination';
import InstantAnswer from '../../components/instantanswer';
import RelatedSearches from '../../components/relatedsearches';

interface PageWrapperProps {
  data: APIResponse | null;
  instantAnswer: { answer: string; image_url: string | null } | null;
  relatedKeywords: string[];
  errorMessage: string | null;
  query: string;
}

export default function PageWrapper({
  data,
  instantAnswer,
  relatedKeywords,
  errorMessage,
  query,
}: PageWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading only once when component mounts with the query
    setIsLoading(false);
  }, [query]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* SearchHeader now includes the Tabs and the Sticky behavior */}
      <SearchHeader />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-10"
          >
            <div className="flex-1 max-w-[650px] space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6 mt-1" />
                </div>
              ))}
            </div>
            <div className="hidden lg:block w-[350px] shrink-0 space-y-4">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-2xl h-64" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-2xl h-48" />
            </div>
          </motion.div>
        ) : (
          <motion.main
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-10"
          >
            <div className="flex-1 max-w-[650px]">
              {errorMessage ? (
                <div className="text-red-500">Error: {errorMessage}</div>
              ) : (
                <>
                  <TextResultsList results={data?.results || []} />

                  {data?.results && data.results.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <Pagination />
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