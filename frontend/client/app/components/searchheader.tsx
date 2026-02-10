'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(false);
    setShowSuggestions(false);
    setSuggestions([]);
  }, [searchParams]);

  // --- MOBILE FIX: Listen for touch events ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        // --- FINAL FIX: Using Port 5000 (Matches your working browser link) ---
        const res = await fetch(`http://192.168.0.174:5000/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // --- RELOAD TRANSITION FIX ---
  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = overrideQuery || query;
    
    if (finalQuery.trim()) {
      setIsLoading(true); // Always trigger loading
      setShowSuggestions(false);
      setSuggestions([]);
      
      router.push(`/search/text?q=${encodeURIComponent(finalQuery)}`);

      // If URL won't change, manually stop loading after delay
      if (finalQuery === initialQuery) {
        setTimeout(() => setIsLoading(false), 800);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && suggestions.length > 0) {
      const topSuggestion = suggestions[0];
      if (topSuggestion.toLowerCase().startsWith(query.toLowerCase())) {
        e.preventDefault();
        setQuery(topSuggestion);
      }
    }
  };

  // --- GHOST TEXT FIX: Case Insensitive Matching ---
  const ghostText = showSuggestions && suggestions.length > 0 && query.trim() && suggestions[0].toLowerCase().startsWith(query.toLowerCase())
    ? query + suggestions[0].slice(query.length)
    : '';

  return (
    <header className="sticky top-0 bg-white dark:bg-black z-50 pt-6 pb-2 border-b border-transparent relative">
      <div className="max-w-[1200px] mx-auto flex items-center gap-4 px-4 md:px-8">
        
        <Link href="/" className="shrink-0">
          <Image 
            src="/images/pyxis.svg" 
            alt="Pyxis" 
            width={90} 
            height={30} 
            className="w-[90px] h-auto md:w-[110px]"
            priority
          />
        </Link>

        <div ref={containerRef} className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSearch} className="relative w-full text-gray-500 focus-within:text-black dark:focus-within:text-white">
            
            {/* Ghost Text Layer */}
            <input
              type="text"
              readOnly
              value={ghostText}
              className="absolute inset-0 w-full h-11 pl-5 pr-12 rounded-full border border-transparent bg-transparent text-base text-gray-400 pointer-events-none z-0"
              aria-hidden="true"
            />

            {/* Input Layer */}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="relative z-10 w-full h-11 pl-5 pr-12 rounded-full border border-gray-300 focus:outline-none focus:border-black transition-all text-base bg-transparent text-black placeholder-gray-500 dark:border-gray-700 dark:text-white dark:placeholder-gray-600"
              placeholder="Search..."
              autoComplete="off"
            />
            
            <button 
              type="submit"
              className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-black hover:opacity-70 transition-opacity z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </form>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.1 }}
                className="absolute top-12 left-0 w-full bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-30 py-2"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(undefined, suggestion);
                    }}
                    className="px-5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-black dark:text-gray-200">
                      <span className="font-semibold">{suggestion.substring(0, query.length)}</span>
                      {suggestion.substring(query.length)}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isLoading && (
        <div className="absolute bottom-[-58px] left-0 w-full h-[2px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <motion.div
            className="h-full bg-black dark:bg-white"
            initial={{ x: '-100%',width: '50%' }}
            animate={{ x: '200%',width: '50%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "linear" 
            }}
          />
        </div>
      )}
    </header>
  );
}