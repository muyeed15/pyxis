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

/**
 * Shared autocomplete hook used by both {@link SearchHeader} and the home
 * search bar.
 */
export function useAutocomplete(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [richSuggestions, setRichSuggestions] = useState<RichSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setRichSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const { signal } = ac;

      try {
        const [textData, entityData] = await Promise.all([
          fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`, { signal })
            .then((r) => (r.ok ? r.json() : { suggestions: [] }))
            .catch(() => ({ suggestions: [] })),
          fetch(
            `https://en.wikipedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=${encodeURIComponent(query)}&gpslimit=3&prop=pageimages|description&pithumbsize=80&format=json&formatversion=2&origin=*`,
            { signal },
          )
            .then((r) => r.json())
            .catch(() => ({})),
        ]);

        if (signal.aborted) return;

        setSuggestions(textData.suggestions || []);

        const pages = entityData.query?.pages || [];
        if (Array.isArray(pages) && pages.length > 0) {
          setRichSuggestions(
            pages
              .filter((p: any) => p.thumbnail || p.description)
              .map((p: any) => ({
                title: p.title,
                description: p.description || "Encyclopedia entry",
                thumbnail: p.thumbnail?.source,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title)}`,
              })),
          );
        } else {
          setRichSuggestions([]);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setSuggestions([]);
          setRichSuggestions([]);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
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

// ---------------------------------------------------------------------------
// SearchHeaderContent
// ---------------------------------------------------------------------------

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
  const urlQuery = searchParams.get("q") || "";

  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    suggestions,
    richSuggestions,
    showSuggestions,
    setShowSuggestions,
  } = useAutocomplete(urlQuery);

  useEffect(() => {
    setIsLoading(false);
    setShowSuggestions(false);
  }, [searchParams]);

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
  }, []);

  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = overrideQuery || query;
    if (q.trim()) {
      setIsLoading(true);
      setShowSuggestions(false);
      router.push(`/search/${activeTab}?q=${encodeURIComponent(q)}`);
      if (q === urlQuery) setTimeout(() => setIsLoading(false), 800);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && suggestions.length > 0) {
      const top = suggestions[0];
      if (top.toLowerCase().startsWith(query.toLowerCase())) {
        e.preventDefault();
        setQuery(top);
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      name: "Images",
      path: "image",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m22 8-6 4 6 4V8Z" />
          <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      name: "News",
      path: "news",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-xl z-50 pt-4 md:pt-6 border-zinc-100 transition-colors shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        {/* --- NEW: MOBILE ONLY PROFILE/SIGN-IN BUTTON --- */}
        <div className="flex md:hidden items-center justify-end mb-3">
          <Link
            href="/signin"
            className="hidden w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 transition-colors shadow-sm"
            aria-label="Sign In"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        {/* EXACTLY YOUR ORIGINAL DESKTOP LOGO */}
        <div className="hidden md:flex items-center justify-between mb-4 md:mb-0 md:absolute md:inset-x-0 md:top-6 md:px-8 pointer-events-none">
          <Link href="/" className="shrink-0 pointer-events-auto">
            <Image
              src="/images/pyxis.svg"
              alt="Pyxis"
              width={90}
              height={30}
              className="w-[80px] h-auto md:w-[105px]"
              priority
            />
          </Link>
          <Link
            href="/signin"
            className="hidden px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors pointer-events-auto shadow-sm"
          >
            Sign In
          </Link>
        </div>

        <div className="flex pb-4 md:pb-5">
          {/* THE FIX: Added `md:ml-[110px] lg:ml-0`. 
            This dodges the logo on tablet, but drops back to 0 margin on desktop! 
          */}
          <div
            ref={containerRef}
            className="w-full md:max-w-[680px] relative md:mt-0 md:ml-[110px] lg:ml-0 transition-all"
          >
            <form
              onSubmit={handleSearch}
              className="relative w-full group"
            >
              {/* MOBILE ONLY: The inner logo you requested */}
              <Link 
                href="/" 
                className="absolute left-[18px] top-1/2 -translate-y-1/2 md:hidden z-20 flex items-center"
              >
                <Image
                  src="/images/pyxis.svg"
                  alt="Pyxis"
                  width={60}
                  height={20}
                  className="w-[56px] h-auto object-contain opacity-90"
                  priority
                />
              </Link>

              {/* Ghost Text - Added pl-[84px] for mobile logo space, md:pl-6 for normal desktop */}
              <input
                type="text"
                readOnly
                value={ghostText}
                aria-hidden="true"
                className="absolute inset-0 w-full h-12 pl-[84px] md:pl-6 pr-12 rounded-full border border-transparent bg-transparent text-[15px] text-zinc-400 pointer-events-none z-0"
              />
              
              {/* Actual Input - Added pl-[84px] for mobile logo space, md:pl-6 for normal desktop */}
              <input
                type="text"
                id="search-input-header"
                name="q"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="relative z-10 w-full h-12 pl-[84px] md:pl-6 pr-14 rounded-full border border-zinc-300 bg-zinc-50/50 text-[15px] text-zinc-900 placeholder-zinc-500 shadow-sm transition-all duration-300 focus:outline-none focus:bg-white focus:border-zinc-100 focus:shadow-md hover:bg-white hover:border-zinc-300"
                placeholder="Search Pyxis..."
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 w-12 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all z-20"
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

            <AnimatePresence>
              {showSuggestions &&
                (suggestions.length > 0 || richSuggestions.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-14 left-0 w-full bg-white rounded-3xl shadow-xl border border-zinc-100/80 overflow-hidden z-30 py-3"
                  >
                    {richSuggestions.map((item, i) => (
                      <div
                        key={`rich-${i}`}
                        onClick={() => {
                          setQuery(item.title);
                          handleSearch(undefined, item.title);
                        }}
                        className="px-5 py-3 hover:bg-zinc-50/80 cursor-pointer flex items-center gap-4 transition-colors group"
                      >
                        <div className="shrink-0 w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-100">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-zinc-900 font-semibold text-[15px] truncate">
                            {item.title}
                          </span>
                          <span className="text-zinc-500 text-xs truncate">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {richSuggestions.length > 0 && suggestions.length > 0 && (
                       <div className="h-px w-full bg-zinc-100 my-1" />
                    )}

                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setQuery(s);
                          handleSearch(undefined, s);
                        }}
                        className="px-6 py-2.5 hover:bg-zinc-50 cursor-pointer flex items-center gap-4 transition-colors"
                      >
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-zinc-800 text-[15px]">
                          <span className="font-semibold text-zinc-950">
                            {s.substring(0, query.length)}
                          </span>
                          {s.substring(query.length)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8">
        {/* THE FIX: Added `md:ml-[110px] lg:ml-0` here too so the tabs match the search bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0 md:ml-[110px] lg:ml-0 transition-all">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.path;
            return (
              <Link
                key={tab.path}
                href={
                  query.trim()
                    ? `/search/${tab.path}?q=${encodeURIComponent(query)}`
                    : "#"
                }
                onClick={(e) => {
                  if (!query.trim()) {
                    e.preventDefault();
                    return;
                  }
                  if (!isActive) setIsLoading(true);
                }}
                className={`relative px-4 py-3 text-[14px] font-medium transition-all duration-200 ease-out select-none whitespace-nowrap rounded-t-xl ${isActive ? "text-zinc-700" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/80"}`}
              >
                <span className={`flex items-center gap-2 ${!query.trim() && !isActive ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <span className={isActive ? "text-zinc-700" : "text-zinc-400"}>
                    {tab.icon}
                  </span>
                  <span>{tab.name}</span>
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 w-full h-[3.5px] bg-zinc-900 rounded-t-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Progress bar shown during navigation */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-100 overflow-hidden z-50">
          <motion.div
            className="h-full bg-zinc-900"
            initial={{ x: "-100%", width: "50%" }}
            animate={{ x: "200%", width: "50%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// SearchHeader (public export)
// ---------------------------------------------------------------------------

export default function SearchHeader() {
  return (
    <Suspense
      fallback={
        <div className="h-[136px] md:h-[144px] w-full bg-white border-b border-zinc-100" />
      }
    >
      <SearchHeaderContent />
    </Suspense>
  );
}