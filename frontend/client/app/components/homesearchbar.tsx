"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAutocomplete } from "./searchheader";

interface HomeSearchBarProps {
  searchMode?: string;
}


export default function HomeSearchBar({ searchMode = "text" }: HomeSearchBarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [placeholderText, setPlaceholderText] = useState("");

  useEffect(() => {
    const questions = [
      "What compass of light drifts in Pyxis’ hush?",
      "Who breathed Pyxis into the breathing dark?",
      "Did Pyxis rise with the first fire of myth?",
      "From which trembling horizon does it awaken?",
      "What bright heart kindles within its silence?",
      "What broken sky-vessel once cradled its glow?",
      "What far galaxies shimmer in its shadowed deep?",
      "What blue star-flame pulses as Alpha Pyxidis?",
      "Can you spot Pyxis between other southern constellations?",
      "Why does Pyxis still whisper to wandering souls?"
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < randomQuestion.length) {
        setPlaceholderText(randomQuestion.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 40);

    return () => clearInterval(typingInterval);
  }, []);

  const {
    query,
    setQuery,
    suggestions,
    richSuggestions,
    showSuggestions,
    setShowSuggestions,
  } = useAutocomplete("");

  useEffect(() => {
    const handle = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [setShowSuggestions]);

  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = overrideQuery || query;
    if (q.trim()) {
      setIsLoading(true);
      setShowSuggestions(false);
      router.push(`/search/${searchMode}?q=${encodeURIComponent(q)}`);
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
    showSuggestions &&
    suggestions.length > 0 &&
    query.trim() &&
    suggestions[0].toLowerCase().startsWith(query.toLowerCase())
      ? suggestions[0]
      : "";

  return (
    <div className="w-full max-w-4xl relative" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative w-full">
        <div className="relative flex items-center w-full group">

          <input
            type="text"
            id="search-input-home"
            name="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasTyped(true);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              setShowSuggestions(true);
              if (query) setHasTyped(true);
            }}
            onKeyDown={handleKeyDown}
            className="peer w-full pl-5 pr-12 py-3 sm:pl-7 sm:pr-16 sm:py-4 border border-gray-300 rounded-full focus:outline-none focus:border-black text-sm sm:text-lg text-black placeholder-gray-400 bg-white shadow-sm truncate"
            placeholder={placeholderText}
            autoComplete="off"
          />

          {ghostText && hasTyped && (
            <div className="absolute inset-0 pointer-events-none flex items-center px-5 sm:px-7 overflow-hidden whitespace-nowrap">
              <span className="text-transparent text-sm sm:text-lg">{query}</span>
              <span className="text-gray-400 text-sm sm:text-lg truncate">
                {ghostText.slice(query.length)}
              </span>
            </div>
          )}

          <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11">
            {isLoading ? (
              <motion.div
                className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 border-t-black rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <div className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute inset-0 w-full h-full text-gray-400 group-focus-within:text-black stroke-[2px] transition-colors duration-200"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
                </svg>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="absolute right-0 top-0 bottom-0 w-16 bg-transparent z-20 rounded-r-full" 
            disabled={isLoading}
          />
        </div>

        <AnimatePresence>
          {showSuggestions && (suggestions.length > 0 || richSuggestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-50 py-3"
            >
              <div className="max-h-[35vh] overflow-y-auto overscroll-contain py-3">
              {richSuggestions.map((item, i) => (
                <div key={i} onClick={() => handleSearch(undefined, item.title)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                    {item.thumbnail && <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-black font-medium text-sm">{item.title}</span>
                    <span className="text-gray-500 text-xs">{item.description}</span>
                  </div>
                </div>
              ))}
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => handleSearch(undefined, s)} className="px-6 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-black text-sm">{s}</span>
                </div>
              ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}