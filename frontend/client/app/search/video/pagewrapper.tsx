'use client';

import { useState, useEffect } from 'react';
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
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

// Fallback data 
const MOCK_VIDEOS: VideoSearchResultItem[] = [
  {
    title: "Understanding Black Holes - A Complete Guide",
    content: "https://www.youtube.com/watch?v=mock1",
    images: "https://picsum.photos/seed/space1/640/360",
    duration: "14:20",
    publisher: "Science Daily",
    published: "2024-01-15T10:00:00.000Z",
    statistics: { viewCount: 1540000 }
  },
  {
    title: "Top 10 Beautiful Destinations in the World",
    content: "https://www.youtube.com/watch?v=mock2",
    images: "https://picsum.photos/seed/travel2/640/360",
    duration: "08:45",
    publisher: "Travel Guide",
    published: "2023-11-20T14:45:00.000Z",
    statistics: { viewCount: 890000 }
  },
  {
    title: "10 Minute Daily Workout Routine at Home",
    content: "https://www.youtube.com/watch?v=mock3",
    images: "https://picsum.photos/seed/fitness3/640/360",
    duration: "10:05",
    publisher: "FitLife",
    published: "2024-02-01T08:30:00.000Z",
    statistics: { viewCount: 2100000 }
  },
  {
    title: "How to Build a Custom Mechanical Keyboard",
    content: "https://www.youtube.com/watch?v=mock4",
    images: "https://picsum.photos/seed/tech4/640/360",
    duration: "22:15",
    publisher: "TechTips",
    published: "2023-09-12T16:15:00.000Z",
    statistics: { viewCount: 450000 }
  }
];

export default function PageWrapper({ 
  data: initialData, 
  errorMessage: initialError, 
  query 
}: PageWrapperProps) {

  const rawUrl = process.env.NEXT_PUBLIC_URL_BACKEND_API || "http://127.0.0.1:5000";
  const backendUrl = rawUrl.replace("localhost", "127.0.0.1");

  const videosKey = query 
    ? `${backendUrl}/search?q=${encodeURIComponent(query)}&type=videos&max_results=50`
    : null;
  
  const { data: videosData, error: videosError, isLoading } = useSWR<APIResponse>(
    videosKey,
    fetcher,
    { 
      fallbackData: initialData || undefined,
      revalidateOnMount: true, 
      revalidateIfStale: false,  
      revalidateOnFocus: false,  
      dedupingInterval: 60000, 
    }
  );

  const data = videosData || initialData;
  const errorMessage = videosError?.message || initialError;
  const isActuallyLoading = isLoading && !data && !errorMessage;

  const apiResults = data?.results as VideoSearchResultItem[] | undefined;
  const fullResults = (apiResults && apiResults.length > 0) ? apiResults : MOCK_VIDEOS;

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
          {errorMessage ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-red-600 text-center">
               <p>Error loading videos: {errorMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
               <VideoResultsList 
                 results={currentVisibleResults} 
                 isLoading={isActuallyLoading}
               />

               {visibleCount < fullResults.length && (
                  <div ref={setObserverTarget} className="flex justify-center pb-12 pt-4 h-20 w-full">
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