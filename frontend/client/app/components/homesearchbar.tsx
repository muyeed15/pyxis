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

  // State for the dynamic typing placeholder
  const [placeholderText, setPlaceholderText] = useState("");

  // Typewriter effect for Pyxis trivia questions
  useEffect(() => {
    const questions = [
      "Do you know what the constellation Pyxis represents in the sky?",
      "Have you ever wondered who first introduced Pyxis to astronomy?",
      "Did you know Pyxis wasn’t part of the original ancient constellations?",
      "Can you guess which hemisphere you need to be in to see Pyxis clearly?",
      "Do you know the name of the brightest star in Pyxis?",
      "Did you know Pyxis used to be part of a much larger constellation?",
      "Have you heard about the massive galaxy cluster located in Pyxis?",
      "Do you know what type of star Alpha Pyxidis is?",
      "Can you spot Pyxis between other southern constellations?",
      "Ever wondered why Pyxis is connected to navigation?"
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
      router.push(`/search/text?q=${encodeURIComponent(q)}`);
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
        <div className="relative flex items-center w-full">
          
          {/* THE INPUT: Marked as 'peer' to trigger the icon's state */}
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
            className="peer w-full pl-7 pr-16 py-4 border border-gray-300 rounded-full focus:outline-none focus:border-black text-lg text-black placeholder-gray-400 bg-white shadow-sm"
            placeholder={placeholderText}
            autoComplete="off"
          />

          {/* GHOST TEXT: Behind the input */}
          {ghostText && hasTyped && (
            <div className="absolute inset-0 pointer-events-none flex items-center px-7">
              <span className="text-transparent text-lg">{query}</span>
              <span className="text-gray-400 text-lg">
                {ghostText.slice(query.length)}
              </span>
            </div>
          )}

          {/* ICON CONTAINER: Responds to input focus using 'peer-focus' */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-11 h-11 rounded-full border border-transparent peer-focus:border-black">
            {isLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                /* Icon is grey, instantly turns black on focus */
                className="w-5 h-5 sm:w-6 h-6 text-gray-400 peer-focus:text-black"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            )}
          </div>

          {/* HIDDEN SUBMIT BUTTON: Placed over the icon area to capture clicks */}
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