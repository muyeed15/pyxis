'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close suggestions
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

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        // Use your backend API endpoint for autocomplete
        const res = await fetch(`http://127.0.0.1:5000/autocomplete?q=${encodeURIComponent(query)}&max_results=8`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle search submission
  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = overrideQuery || query;
    
    if (finalQuery.trim()) {
      setIsLoading(true);
      setShowSuggestions(false);
      
      // Navigate to text search page with the query
      router.push(`/search/text?q=${encodeURIComponent(finalQuery)}`);
    }
  };

  // Handle Enter key and Tab for autocomplete
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      const topSuggestion = suggestions[0];
      if (topSuggestion.toLowerCase().startsWith(query.toLowerCase())) {
        e.preventDefault();
        setQuery(topSuggestion);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setHasTyped(true);
    setShowSuggestions(true);
  };

  // Ghost text for autocomplete preview
  const ghostText = showSuggestions && suggestions.length > 0 && query.trim() && suggestions[0].toLowerCase().startsWith(query.toLowerCase())
    ? suggestions[0]
    : '';

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl relative" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative w-full">
        {/* Search Container - Always horizontal, button on right */}
        <div className="flex items-center gap-2 relative">
          {/* Actual Search Input */}
          <div className="relative flex-1">
            {/* Ghost Text Layer for autocomplete preview */}
            {ghostText && hasTyped && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <input
                  type="text"
                  readOnly
                  value={ghostText}
                  className="w-full h-full px-4 py-3 sm:px-6 sm:py-3.5 border border-transparent rounded-full bg-transparent text-base text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                />
                {/* This div shows only the ghost (remaining) text */}
                <div className="absolute inset-0 flex items-center px-4 py-3 sm:px-6 sm:py-3.5 pointer-events-none">
                  <span className="text-transparent">{query}</span>
                  <span className="text-gray-400 dark:text-gray-500">{ghostText.slice(query.length)}</span>
                </div>
              </div>
            )}

            {/* Actual Search Input */}
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                setShowSuggestions(true);
                if (query) setHasTyped(true);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setHasTyped(false), 200)}
              className="relative z-10 w-full px-4 py-3 sm:px-6 sm:py-3.5 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:border-black dark:focus:border-white text-base bg-white dark:bg-[#1a1a1a] text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Search Pyxis"
              autoComplete="off"
            />
          </div>

          {/* Search Button with Icon */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition-opacity disabled:opacity-70 w-12 h-12 sm:w-14 sm:h-14 z-10 shrink-0"
          >
            {isLoading ? (
              <motion.div
                className="w-6 h-6 border-2 border-white dark:border-black border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="currentColor" 
                className="w-6 h-6 sm:w-7 sm:h-7"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" 
                />
              </svg>
            )}
          </button>
        </div>

        {/* Suggestions Dropdown with proper animations */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-30 py-2"
            >
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(undefined, suggestion);
                  }}
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                  className="px-5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-3"
                >
                  <svg 
                    className="w-4 h-4 text-gray-400 dark:text-gray-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                  <span className="text-black dark:text-gray-200">
                    {query && suggestion.toLowerCase().startsWith(query.toLowerCase()) ? (
                      <>
                        <span className="font-semibold">{suggestion.substring(0, query.length)}</span>
                        <span>{suggestion.substring(query.length)}</span>
                      </>
                    ) : (
                      <span>{suggestion}</span>
                    )}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Loading animation at the bottom (same as SearchHeader) */}
      {isLoading && (
        <div className="absolute bottom-[-8px] left-0 w-full h-[2px] bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-black dark:bg-white"
            initial={{ x: '-100%', width: '50%' }}
            animate={{ x: '200%', width: '50%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "linear" 
            }}
          />
        </div>
      )}
    </div>
  );
}