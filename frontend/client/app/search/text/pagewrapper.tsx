'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { APIResponse, TextSearchResultItem } from './types';
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

export default function PageWrapper({
  data,
  instantAnswer,
  relatedKeywords,
  errorMessage,
  query,
}: PageWrapperProps) {
  
  const fullResults = data?.results || [];
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    
    setVisibleCount(10);
    setIsLoading(false);
  }, [query]);

  
  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 10, fullResults.length));
  };

  
  const currentVisibleResults = fullResults.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
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
             {/* skeleton content*/}
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
                  <TextResultsList results={currentVisibleResults} />

                  
                  {visibleCount < fullResults.length && (
                    <div className="mt-8 mb-12">
                      <button
                        onClick={handleLoadMore}
                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
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