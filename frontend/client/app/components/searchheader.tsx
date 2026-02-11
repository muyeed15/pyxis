'use client';

import { useState, useEffect, useRef, KeyboardEvent, Suspense } from 'react';
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

function SearchHeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  // -- State: Search Logic --
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [richSuggestions, setRichSuggestions] = useState<RichSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // -- State: UI & Loading --
  // We use a single loading state for both search submission and tab switching
  const [isLoading, setIsLoading] = useState(false);

  // -- Derived State: Tabs --
  // Determine current active tab from URL path (you might need to adjust this logic 
  // depending on how exactly your routing works, but this matches your previous setup)
  // Since this component is likely used on pages like /search/text, /search/image, etc.
  // We can infer the tab from the pathname or assume a prop is passed. 
  // However, to keep it self-contained like your SearchTabs, we'll assume standard segments.
  // For now, we will default to 'text' if not easily determined, or you can parse window.location.
  // NOTE: In a real Next.js app, you might want to use `usePathname` to set the active tab.
  // For this implementation, I will rely on the link clicks setting the style.
  // To highlight the correct tab on load, we check the pathname:
  
  // (We need usePathname to know which tab is active)
  // Let's add the import dynamically or assume standard routing:
  // Using simple check for now based on your previous 'currentTab' prop logic.
  // We'll trust the user clicks for interaction, but for persistent highlighting,
  // we'd typically need usePathname. I will add a simple logic here.
  
  // -- Effect: Reset on Navigation --
  useEffect(() => {
    setIsLoading(false);
    setShowSuggestions(false);
    setSuggestions([]);
  }, [searchParams]);

  // -- Effect: Click Outside --
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

  // -- Effect: Fetch Suggestions --
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setRichSuggestions([]);
        return;
      }

      // 1. Fetch Text Suggestions
      const textPromise = fetch(`${process.env.NEXT_PUBLIC_URL_BACKEND_API}//autocomplete?q=${encodeURIComponent(query)}`)
        .then(res => res.ok ? res.json() : { suggestions: [] })
        .catch(() => ({ suggestions: [] })); 

      // 2. Fetch Rich Entity (Wikipedia)
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=${encodeURIComponent(query)}&gpslimit=3&prop=pageimages|description|info&pithumbsize=200&inprop=url&format=json&formatversion=2&origin=*`;
      const wikiPromise = fetch(wikiUrl)
        .then(res => res.json())
        .catch(() => ({})); 

      const [textData, entityData] = await Promise.all([textPromise, wikiPromise]);

      setSuggestions(textData.suggestions || []);

      const pages = entityData.query?.pages || [];
      if (Array.isArray(pages) && pages.length > 0) {
        const validPages = pages
          .filter((page: any) => page.thumbnail || page.description)
          .map((page: any) => ({
            title: page.title,
            description: page.description || "Encyclopedia entry",
            thumbnail: page.thumbnail?.source,
            url: page.fullurl
          }));
        setRichSuggestions(validPages);
      } else {
        setRichSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // -- Handlers --
  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = overrideQuery || query;
    
    if (finalQuery.trim()) {
      setIsLoading(true); 
      setShowSuggestions(false);
      setSuggestions([]);
      setRichSuggestions([]);
      
      router.push(`/search/text?q=${encodeURIComponent(finalQuery)}`);

      // Fallback to stop loading if navigation doesn't happen quickly (optional safety)
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


  // -- Tabs Configuration --
  // We define this here to keep it all in one file
  const tabs = [
    { 
      name: 'All', 
      path: 'text',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    },
    { 
      name: 'Images', 
      path: 'image',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    },
    { 
      name: 'Videos', 
      path: 'video',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
    },
    { 
      name: 'News', 
      path: 'news',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
    },
    { 
      name: 'Books', 
      path: 'book',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    },
  ];

  // Helper to determine active tab based on window location or default
  // Ideally, you would use usePathname() here, but we can also rely on visual click state if simple
  const getCurrentTab = () => {
    if (typeof window !== 'undefined') {
       const path = window.location.pathname;
       if (path.includes('/image')) return 'image';
       if (path.includes('/video')) return 'video';
       if (path.includes('/news')) return 'news';
       if (path.includes('/book')) return 'book';
    }
    return 'text'; // Default
  };
  const activeTab = getCurrentTab();


  return (
    <header className="sticky top-0 bg-white dark:bg-black z-50 pt-6 border-b border-gray-200 dark:border-gray-800 transition-colors">
      
      {/* 1. Main Header Row: Logo & Search Input */}
      <div className="max-w-[1200px] mx-auto flex items-center gap-4 px-4 md:px-8 pb-4">
        
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
            
            {/* Ghost Text */}
            <input
              type="text"
              readOnly
              value={ghostText}
              className="absolute inset-0 w-full h-11 pl-5 pr-12 rounded-full border border-transparent bg-transparent text-base text-gray-400 pointer-events-none z-0"
              aria-hidden="true"
            />

            {/* Actual Input */}
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

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || richSuggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.1 }}
                className="absolute top-12 left-0 w-full bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-30 py-2"
              >
                {richSuggestions.map((item, index) => (
                  <div 
                    key={`rich-${index}`}
                    onClick={() => {
                      setQuery(item.title);
                      handleSearch(undefined, item.title);
                    }}
                    className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-4 transition-colors"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-black dark:text-white font-semibold text-sm">{item.title}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1">{item.description}</span>
                    </div>
                  </div>
                ))}
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

      {/* 2. Tabs Row */}
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.path;
            
            return (
              <Link
                key={tab.path}
                href={`/search/${tab.path}?q=${encodeURIComponent(query)}`}
                onClick={() => {
                   if (!isActive) setIsLoading(true);
                }}
                className={`
                  relative py-3 text-sm font-medium transition-colors duration-200 ease-out select-none whitespace-nowrap
                  ${isActive 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
                  }
                `}
              >
                <span className={`
                  flex items-center gap-2 pb-[1px] border-b-2
                  ${isActive ? 'border-black dark:border-white' : 'border-transparent'}
                `}>
                  <span className={isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}>
                    {tab.icon}
                  </span>
                  <span>{tab.name}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Loading Bar (Attached to bottom of Header) */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-100 dark:bg-gray-800 overflow-hidden z-50">
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
    </header>
  );
}

// Wrap in Suspense for useSearchParams
export default function SearchHeader() {
  return (
    <Suspense fallback={<div className="h-24 w-full bg-white dark:bg-black" />}>
      <SearchHeaderContent />
    </Suspense>
  );
}