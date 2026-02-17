'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { APIResponse, TextSearchResultItem, AutocompleteData } from '../../types';
import SearchHeader from '../../components/searchheader';
import TextResultsList from './text';
import InstantAnswer from '../../components/instantanswer'; 
import RelatedSearches from '../../components/relatedsearches';

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Instant Answer Skeleton */}
      <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
        <div className="w-full h-32 bg-gray-100 animate-pulse"></div>
        <div className="p-5 space-y-3">
          <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse"></div>
          <div className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse"></div>
        </div>
      </div>
      {/* Related Searches Skeleton */}
      <div className="p-4 border border-gray-100 rounded-lg bg-gray-50 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
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
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

export default function PageWrapper({
  data: initialData,
  relatedKeywords: initialKeywords,
  errorMessage: initialError,
  query,
  instantAnswer: initialInstantAnswer
}: PageWrapperProps) {

  const rawUrl = process.env.NEXT_PUBLIC_URL_BACKEND_API || "http://127.0.0.1:5000";
  const backendUrl = rawUrl.replace("localhost", "127.0.0.1");

  const textKey = query
    ? `${backendUrl}/search?q=${encodeURIComponent(query)}&type=text&max_results=50`
    : null;

  const instantKey = query
    ? `${backendUrl}/instant?q=${encodeURIComponent(query)}`
    : null;

  const autocompleteKey = query
    ? `${backendUrl}/autocomplete?q=${encodeURIComponent(query)}`
    : null;

  const { data: textData, error: textError, isLoading: textLoading } = useSWR<APIResponse>(
    textKey,
    fetcher,
    {
      fallbackData: initialData || undefined,
      revalidateOnMount: true,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      dedupingInterval: 600000,
    }
  );

  const { data: instantData, isLoading: instantLoading } = useSWR(
    instantKey,
    fetcher,
    {
      fallbackData: initialInstantAnswer || undefined,
      revalidateOnMount: true,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      dedupingInterval: 600000,
    }
  );

  const { data: autocompleteData } = useSWR<AutocompleteData>(
    autocompleteKey,
    fetcher,
    {
      fallbackData: initialKeywords.length > 0 ? { suggestions: initialKeywords } : undefined,
      revalidateOnMount: true,
      dedupingInterval: 600000,
    }
  );

  const data = textData || initialData;
  const errorMessage = textError?.message || initialError;
  const results = (data?.results as TextSearchResultItem[]) || [];
  
  const related = autocompleteData?.suggestions || initialKeywords;
  const activeInstantAnswer = instantData || initialInstantAnswer;
  const isMainLoading = textLoading && !data && !errorMessage;
  
  const showSidebarSkeleton = isMainLoading || (instantLoading && !activeInstantAnswer);

  const [visibleCount, setVisibleCount] = useState(10);
  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 10, results.length));
  };
  const currentVisibleResults = results.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader />
      
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT COLUMN: Main Results */}
          <div className="flex-1 min-w-0">
            {errorMessage ? (
               <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-red-600">
                 <p className="font-semibold">Error loading results</p>
                 <p className="text-sm opacity-80">{errorMessage}</p>
               </div>
            ) : isMainLoading ? (
               <div className="space-y-8 max-w-[650px] animate-pulse mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-16 bg-gray-100 rounded w-full"></div>
                    </div>
                  ))}
               </div>
            ) : (
               <>
                 <TextResultsList results={currentVisibleResults} />

                 {visibleCount < results.length && (
                    <div className="mt-8 mb-12 max-w-[650px]">
                      <button
                        onClick={handleLoadMore}
                        className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200"
                      >
                        Show More Results
                      </button>
                    </div>
                  )}
               </>
            )}
          </div>

          {/* RIGHT COLUMN: Sidebar (Synchronized) */}
          <div className="hidden lg:block w-[350px] shrink-0 space-y-6">
             {showSidebarSkeleton ? (
               <SidebarSkeleton />
             ) : (
               <>
                 {activeInstantAnswer && !activeInstantAnswer.error && (
                   <InstantAnswer 
                      answer={activeInstantAnswer.answer}
                      imageUrl={activeInstantAnswer.image_url}
                      query={query}
                   />
                 )}

                 {related && related.length > 0 && (
                   <RelatedSearches keywords={related} currentQuery={query} />
                 )}
               </>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}