"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAutocomplete } from "./searchheader";

export default function HomeSearchBar() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { query, setQuery, suggestions, richSuggestions, showSuggestions, setShowSuggestions } =
    useAutocomplete("");

  useEffect(() => {
    const handle = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, []);

  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = overrideQuery || query;
    if (q.trim()) {
      setIsLoading(true);
      setShowSuggestions(false);
      router.push(`/search/text?q=${encodeURIComponent(q)}&safesearch=on`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Tab" && suggestions.length > 0) {
      const top = suggestions[0];
      if (top.toLowerCase().startsWith(query.toLowerCase())) {
        e.preventDefault();
        setQuery(top);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const ghostText =
    showSuggestions && suggestions.length > 0 && query.trim() &&
    suggestions[0].toLowerCase().startsWith(query.toLowerCase())
      ? suggestions[0]
      : "";

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl relative" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative w-full">
        <div className="flex items-center gap-2 relative">
          <div className="relative flex-1">
            {ghostText && hasTyped && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 flex items-center px-4 py-3 sm:px-6 sm:py-3.5">
                  <span className="text-transparent text-base">{query}</span>
                  <span className="text-gray-400 text-base">{ghostText.slice(query.length)}</span>
                </div>
              </div>
            )}
            <input
              type="text" id="search-input-home" name="q" value={query}
              onChange={(e) => { setQuery(e.target.value); setHasTyped(true); setShowSuggestions(true); }}
              onFocus={() => { setShowSuggestions(true); if (query) setHasTyped(true); }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setHasTyped(false), 200)}
              className="relative z-10 w-full px-4 py-3 sm:px-6 sm:py-3.5 border border-gray-300 rounded-full focus:outline-none focus:border-black text-base text-black placeholder-gray-500 bg-white"
              placeholder="Search Pyxis" autoComplete="off"
            />
          </div>

          <button type="submit" disabled={isLoading}
            className="flex items-center justify-center bg-black text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-70 w-12 h-12 sm:w-14 sm:h-14 z-10 shrink-0">
            {isLoading ? (
              <motion.div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showSuggestions && (suggestions.length > 0 || richSuggestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
              className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-30 py-2"
            >
              {richSuggestions.map((item, i) => (
                <div key={`rich-${i}`} onClick={() => { setQuery(item.title); handleSearch(undefined, item.title); }}
                  className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center gap-4 transition-colors">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-200 overflow-hidden">
                    {item.thumbnail
                      ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="text-black font-semibold text-sm text-left">{item.title}</span>
                    <span className="text-gray-500 text-xs line-clamp-1 text-left">{item.description}</span>
                  </div>
                </div>
              ))}
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => { setQuery(s); handleSearch(undefined, s); }}
                  onMouseDown={(e) => e.preventDefault()}
                  className="px-5 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <span className="text-black">
                    {query && s.toLowerCase().startsWith(query.toLowerCase()) ? (
                      <><span className="font-semibold">{s.substring(0, query.length)}</span><span>{s.substring(query.length)}</span></>
                    ) : (
                      <span>{s}</span>
                    )}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {isLoading && (
        <div className="absolute bottom-[-8px] left-0 w-full h-[2px] bg-gray-100 overflow-hidden rounded-full">
          <motion.div className="h-full bg-black"
            initial={{ x: "-100%", width: "50%" }} animate={{ x: "200%", width: "50%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}