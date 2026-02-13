'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { APIResponse, ImageSearchResultItem } from '../../types';
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
  data, 
  relatedKeywords, 
  errorMessage, 
  query,
  tags 
}: PageWrapperProps) {
  const fullResults = (data?.results as ImageSearchResultItem[]) || [];
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

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
      { 
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
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
          transition={{ duration: 0.3 }}
          className="max-w-[1600px] mx-auto px-4 md:px-6 py-4"
        >
          
          {/* Category Bar */}
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
               <ImageResultsList results={currentVisibleResults} />
  
               {/* --- INFINITE SCROLL TRIGGER / LOADER --- */}
               {visibleCount < fullResults.length && (
                  <div ref={observerTarget} className="flex justify-center pb-12 pt-4 h-20 w-full">
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