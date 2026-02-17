"use client";

import { useState, useEffect, useRef, KeyboardEvent, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export interface RichSuggestion {
  title: string;
  description: string;
  thumbnail?: string;
  url: string;
}

export function useAutocomplete(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [richSuggestions, setRichSuggestions] = useState<RichSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setRichSuggestions([]);
        return;
      }

      const textPromise = fetch(
        `/api/autocomplete?q=${encodeURIComponent(query)}`,
      )
        .then((res) => (res.ok ? res.json() : { suggestions: [] }))
        .catch(() => ({ suggestions: [] }));

      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=${encodeURIComponent(query)}&gpslimit=3&prop=pageimages|description|info&pithumbsize=200&inprop=url&format=json&formatversion=2&origin=*`;
      const wikiPromise = fetch(wikiUrl)
        .then((res) => res.json())
        .catch(() => ({}));

      const [textData, entityData] = await Promise.all([
        textPromise,
        wikiPromise,
      ]);

      setSuggestions(textData.suggestions || []);

      const pages = entityData.query?.pages || [];
      if (Array.isArray(pages) && pages.length > 0) {
        const validPages = pages
          .filter((page: any) => page.thumbnail || page.description)
          .map((page: any) => ({
            title: page.title,
            description: page.description || "Encyclopedia entry",
            thumbnail: page.thumbnail?.source,
            url: page.fullurl,
          }));
        setRichSuggestions(validPages);
      } else {
        setRichSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return {
    query,
    setQuery,
    suggestions,
    richSuggestions,
    showSuggestions,
    setShowSuggestions,
  };
}

function SearchHeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const getActiveTab = () => {
    if (pathname.includes("/search/image")) return "image";
    if (pathname.includes("/search/video")) return "video";
    if (pathname.includes("/search/news")) return "news";
    if (pathname.includes("/search/book")) return "book";
    return "text"; 
  };
  
  const activeTab = getActiveTab();

  const initialQuery = searchParams.get("q") || "";
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    suggestions,
    richSuggestions,
    showSuggestions,
    setShowSuggestions,
  } = useAutocomplete(initialQuery);

  useEffect(() => {
    setIsLoading(false);
    setShowSuggestions(false);
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = overrideQuery || query;
    if (finalQuery.trim()) {
      setIsLoading(true);
      setShowSuggestions(false);

      // Navigate to the current active tab with the new query
      // If we are on /search/image, we stay on /search/image
      // If we are on /search/text (or just /search), we stay there
      router.push(`/search/${activeTab}?q=${encodeURIComponent(finalQuery)}`);
      
      if (finalQuery === initialQuery) {
        setTimeout(() => setIsLoading(false), 800);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && suggestions.length > 0) {
      const topSuggestion = suggestions[0];
      if (topSuggestion.toLowerCase().startsWith(query.toLowerCase())) {
        e.preventDefault();
        setQuery(topSuggestion);
      }
    }
  };

  const ghostText =
    showSuggestions &&
    suggestions.length > 0 &&
    query.trim() &&
    suggestions[0].toLowerCase().startsWith(query.toLowerCase())
      ? query + suggestions[0].slice(query.length)
      : "";

  const tabs = [
    {
      name: "All",
      path: "text",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      name: "Images",
      path: "image",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      ),
    },
    {
      name: "Videos",
      path: "video",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m22 8-6 4 6 4V8Z" />
          <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      name: "News",
      path: "news",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      ),
    },
    {
      name: "Books",
      path: "book",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="sticky top-0 bg-white z-50 pt-4 md:pt-6 border-b border-gray-200 transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Sign In Button */}
        <div className="flex items-center justify-between mb-4 md:mb-0 md:absolute md:inset-x-0 md:top-6 md:px-8 pointer-events-none">
          <Link href="/" className="shrink-0 pointer-events-auto">
            <Image
              src="/images/pyxis.svg"
              alt="Pyxis"
              width={90}
              height={30}
              className="w-[80px] h-auto md:w-[110px]"
              priority
            />
          </Link>
          <Link
            href="/signin"
            className="px-4 py-1.5 md:px-5 md:py-2.5 bg-black text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity pointer-events-auto"
          >
            Sign In
          </Link>
        </div>

        {/* Search Bar Row */}
        <div className="flex pb-4">
          <div ref={containerRef} className="w-full md:max-w-2xl relative md:mt-1">
            <form
              onSubmit={handleSearch}
              className="relative w-full text-gray-500 focus-within:text-black"
            >
              <input
                type="text"
                readOnly
                value={ghostText}
                className="absolute inset-0 w-full h-11 pl-5 pr-12 rounded-full border border-transparent bg-transparent text-base text-gray-400 pointer-events-none z-0"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="relative z-10 w-full h-11 pl-5 pr-12 rounded-full border border-gray-300 focus:outline-none focus:border-black transition-all text-base bg-transparent text-black placeholder-gray-500 shadow-sm"
                placeholder="Search..."
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-black hover:opacity-70 transition-opacity z-20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showSuggestions &&
                (suggestions.length > 0 || richSuggestions.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute top-12 left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30 py-2"
                  >
                    {richSuggestions.map((item, index) => (
                      <div
                        key={`rich-${index}`}
                        onClick={() => {
                          setQuery(item.title);
                          handleSearch(undefined, item.title);
                        }}
                        className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center gap-4 transition-colors"
                      >
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-black font-semibold text-sm">
                            {item.title}
                          </span>
                          <span className="text-gray-500 text-xs line-clamp-1">
                            {item.description}
                          </span>
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
                        className="px-5 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400"
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
                        <span className="text-black text-sm md:text-base">
                          <span className="font-semibold">
                            {suggestion.substring(0, query.length)}
                          </span>
                          {suggestion.substring(query.length)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
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
                className={`relative py-3 text-sm font-medium transition-colors duration-200 ease-out select-none whitespace-nowrap ${isActive ? "text-black" : "text-gray-500 hover:text-black"}`}
              >
                <span
                  className={`flex items-center gap-2 pb-[1px] border-b-2 ${isActive ? "border-black" : "border-transparent"}`}
                >
                  <span
                    className={
                      isActive
                        ? "opacity-100"
                        : "opacity-70 group-hover:opacity-100"
                    }
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.name}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Loading Bar */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-100 overflow-hidden z-50">
          <motion.div
            className="h-full bg-black"
            initial={{ x: "-100%", width: "50%" }}
            animate={{ x: "200%", width: "50%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>
      )}
    </header>
  );
}

export default function SearchHeader() {
  return (
    <Suspense fallback={<div className="h-24 w-full bg-white" />}>
      <SearchHeaderContent />
    </Suspense>
  );
}