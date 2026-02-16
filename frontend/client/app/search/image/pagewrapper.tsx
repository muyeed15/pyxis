'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import type { APIResponse, ImageSearchResultItem, AutocompleteData } from '../../types';
import SearchHeader from '../../components/searchheader';
import ImageResultsList from './image';
import ImageCategoryBar from './image-category-bar'; 

interface PageWrapperProps {
  data: APIResponse | null;
  relatedKeywords: string[]; 
  errorMessage: string | null;
  query: string;
  tags: string[]; 
}

export default function PageWrapper({ 
  data: initialData, 
  relatedKeywords: initialKeywords, 
  errorMessage: initialError, 
  query,
  tags 
}: PageWrapperProps) {
  const combinedSearchQuery = [query, ...tags].join(" ").trim();
  
  const imagesKey = combinedSearchQuery 
    ? `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/search?q=${encodeURIComponent(combinedSearchQuery)}&type=images&max_results=100`
    : null;
  
  const autocompleteKey = combinedSearchQuery
    ? `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/autocomplete?q=${encodeURIComponent(combinedSearchQuery)}`
    : null;

  const { data: imagesData, error: imagesError, isLoading } = useSWR<APIResponse>(
    imagesKey,
    { 
      fallbackData: initialData || undefined,
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, 
      focusThrottleInterval: 300000,
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

  const relatedKeywords = autocompleteData?.suggestions || initialKeywords;
  const data = imagesData || initialData;
  const errorMessage = imagesError?.message || initialError;

  // Correctly determine if we are in the initial loading state
  const isActuallyLoading = isLoading || (!data && !errorMessage);

  const fullResults = (data?.results as ImageSearchResultItem[]) || [];
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // FIX: Use state callback for the ref to ensure observer attaches when element renders
  const [observerTarget, setObserverTarget] = useState<HTMLDivElement | null>(null);

  const displayCategories = useMemo(() => {
    if (fullResults.length === 0) return relatedKeywords;

    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      'the', 'and', 'a', 'an', 'of', 'in', 'for', 'on', 'with', 'by', 'at', 'to', 'from', 'is', 'it', 
      'that', 'this', 'your', 'best', 'choose', 'thrives', 'environment', 'climate', 'wallpapers', 
      'images', 'pictures', 'photos', 'hd', '4k', 'background', 'download', 'free', 'stock', 'photo', 
      'image', 'picture', 'desktop', 'phone', 'mobile', 'screen', 'full', 'size', 'view', 'about', 
      'review', 'top', 'quality', 'high', 'resolution', 'get', 'make', 'how', 'what', 'when', 'where'
    ]);
    
    query.toLowerCase().split(' ').forEach(w => stopWords.add(w));
    tags.forEach(t => stopWords.add(t.toLowerCase()));

    fullResults.forEach(item => {
      const words = item.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    const topWords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    return topWords.length > 0 ? topWords : relatedKeywords;
  }, [fullResults, query, relatedKeywords, tags]);

  const hasCategories = displayCategories.length > 0;

  // Reset logic when query changes
  useEffect(() => {
    setVisibleCount(20);
    setIsLoadingMore(false);
  }, [query, tags]);

  // FIX: Robust Intersection Observer using state-ref
  useEffect(() => {
    if (!observerTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // Check conditions strictly inside the callback
        if (target.isIntersecting && !isLoadingMore && visibleCount < fullResults.length) {
          setIsLoadingMore(true);
          
          // Small delay for UX
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 20, fullResults.length));
            setIsLoadingMore(false);
          }, 600);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px', // Increased margin to trigger slightly earlier
      }
    );

    observer.observe(observerTarget);

    return () => {
      observer.disconnect();
    };
  }, [observerTarget, isLoadingMore, visibleCount, fullResults.length]);


  const currentVisibleResults = fullResults.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />

      <AnimatePresence mode="wait">
        <motion.main 
          key={query + tags.join(',')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="max-w-[1600px] mx-auto px-4 md:px-6 py-4"
        >
          
          {(hasCategories || tags.length > 0) && (
            <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
               <ImageCategoryBar 
                  keywords={displayCategories} 
                  currentQuery={query}
                  activeTags={tags} 
               />
            </div>
          )}
  
          {errorMessage ? (
            <div className="text-red-500 mt-10 text-center">Error: {errorMessage}</div>
          ) : (
            <div className="flex flex-col gap-8">
               <ImageResultsList 
                 results={currentVisibleResults} 
                 isLoading={isActuallyLoading}
               />
  
               {/* FIX: Use ref callback (setObserverTarget) here */}
               {visibleCount < fullResults.length && (
                  <div 
                    ref={setObserverTarget} 
                    className="flex justify-center pb-12 pt-4 h-20 w-full"
                  >
                    {isLoadingMore && (
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                       </div>
                    )}
                  </div>
               )}
            </div>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}