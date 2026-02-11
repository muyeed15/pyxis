'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';


interface RichSuggestion {
  title: string;
  description: string;
  thumbnail?: string;
  url: string;
}

export default function SearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [richSuggestion, setRichSuggestion] = useState<RichSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(false);
    setShowSuggestions(false);
    setSuggestions([]);
  }, [searchParams]);


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
        setRichSuggestion(null);
        return;
      }

      
      const textPromise = fetch(`${process.env.NEXT_PUBLIC_URL_BACKEND_API}//autocomplete?q=${encodeURIComponent(query)}`)
        .then(res => res.ok ? res.json() : { suggestions: [] })
        .catch(() => ({ suggestions: [] })); 

      const wikiPromise = fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=${encodeURIComponent(query)}&gpslimit=1&prop=pageimages|description|info&pithumbsize=200&inprop=url&format=json&origin=*`)
        .then(res => res.json())
        .catch(() => ({})); 

      
      const [textData, entityData] = await Promise.all([textPromise, wikiPromise]);

     
      setSuggestions(textData.suggestions || []);

      const pages = entityData.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        if (page && (page.thumbnail || page.description)) {
          setRichSuggestion({
            title: page.title,
            description: page.description,
            thumbnail: page.thumbnail?.source,
            url: page.fullurl
          });
        } else {
          setRichSuggestion(null);
        }
      } else {
        setRichSuggestion(null);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);


  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = overrideQuery || query;
    
    if (finalQuery.trim()) {
      setIsLoading(true); 
      setShowSuggestions(false);
      setSuggestions([]);
      
      router.push(`/search/text?q=${encodeURIComponent(finalQuery)}`);

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
                {richSuggestion && (
              <div 
                onClick={() => {
                  setQuery(richSuggestion.title);
                  handleSearch(undefined, richSuggestion.title);
                }}
                className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-4 transition-colors"
              >
                {/* Image */}
                <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {richSuggestion.thumbnail ? (
                    <img 
                      src={richSuggestion.thumbnail} 
                      alt={richSuggestion.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    // Fallback icon if no image
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                
                {/* Text Info */}
                <div className="flex flex-col">
                  <span className="text-black dark:text-white font-semibold text-sm">
                    {richSuggestion.title}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1">
                    {richSuggestion.description}
                  </span>
                </div>
              </div>
            )}
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