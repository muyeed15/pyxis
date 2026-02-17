'use client';

import { useState, useEffect, useMemo } from 'react';
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

export default function PageWrapper({ 
  data: initialData, 
  relatedKeywords: initialKeywords, 
  errorMessage: initialError, 
  query,
  tags 
}: PageWrapperProps) {

  const rawUrl = process.env.NEXT_PUBLIC_URL_BACKEND_API || "http://127.0.0.1:5000";
  const backendUrl = rawUrl.replace("localhost", "127.0.0.1");

  const combinedSearchQuery = [query, ...tags].join(" ").trim();

  const imagesKey = combinedSearchQuery 
    ? `${backendUrl}/search?q=${encodeURIComponent(combinedSearchQuery)}&type=images&max_results=100`
    : null;
  
  const autocompleteKey = combinedSearchQuery
    ? `${backendUrl}/autocomplete?q=${encodeURIComponent(combinedSearchQuery)}`
    : null;

  const { data: imagesData, error: imagesError, isLoading } = useSWR<APIResponse>(
    imagesKey,
    fetcher,
    { 
      fallbackData: initialData || undefined,
      revalidateOnMount: true, 
      revalidateIfStale: false,  
      revalidateOnFocus: false,  
      revalidateOnReconnect: false,
      dedupingInterval: 300000, 
      focusThrottleInterval: 300000,
    }
  );

  const { data: autocompleteData } = useSWR<AutocompleteData>(
    autocompleteKey,
    fetcher,
    { 
      fallbackData: initialKeywords.length > 0 ? { suggestions: initialKeywords } : undefined,
      revalidateOnMount: true,
      dedupingInterval: 300000,
    }
  );

  const relatedKeywords = autocompleteData?.suggestions || initialKeywords;
  const data = imagesData || initialData;
  const errorMessage = imagesError?.message || initialError;

  const isActuallyLoading = isLoading && !data && !errorMessage;

  const fullResults = (data?.results as ImageSearchResultItem[]) || [];
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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

  useEffect(() => {
    setVisibleCount(20);
    setIsLoadingMore(false);
  }, [query, tags]);

  useEffect(() => {
    if (!observerTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore && visibleCount < fullResults.length) {
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
            <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-red-600 text-center">
               <p>Error loading images: {errorMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
               <ImageResultsList 
                 results={currentVisibleResults} 
                 isLoading={isActuallyLoading}
               />

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