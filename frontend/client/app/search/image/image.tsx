"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ImageSearchResultItem } from "../../types";

const PANEL_WIDTH = 488;
const EAGER_LOAD_COUNT = 5;

interface ImageResultsListProps {
  results: ImageSearchResultItem[];
  isLoading?: boolean;
  selectedIndex: number | null;
  onSelect: (i: number | null) => void;
}

export default function ImageResultsList({
  results,
  isLoading = false,
  selectedIndex,
  onSelect,
}: ImageResultsListProps) {
  if (isLoading) return <ImageSkeletonGrid />;

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <svg
          className="w-10 h-10 opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">No images found</p>
      </div>
    );
  }

  const isOpen = selectedIndex !== null;

  return (
    <div
      className={
        isOpen
          ? "columns-2 sm:columns-3 lg:columns-4"
          : "columns-2 sm:columns-3 md:columns-4 lg:columns-5"
      }
      style={{ columnGap: "0.625rem" }}
    >
      {results.map((item, i) => (
        <div
          key={`${item.image}-${i}`}
          className="break-inside-avoid inline-block w-full mb-[0.875rem]"
        >
          <ImageCard
            item={item}
            index={i}
            isSelected={selectedIndex === i}
            onClick={() => onSelect(i === selectedIndex ? null : i)}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImageCard
// ---------------------------------------------------------------------------

interface ImageCardProps {
  item: ImageSearchResultItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function ImageCard({ item, index, isSelected, onClick }: ImageCardProps) {
  const thumb = item.thumbnail?.trim();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [item.thumbnail]);

  if (!thumb || hidden) return null;

  const hostname = (() => {
    try {
      return new URL(item.url).hostname;
    } catch {
      return "";
    }
  })();

  const ratio =
    item.width && item.height ? `${item.width}/${item.height}` : "4/3";

  return (
    <div
      className={`cursor-pointer flex flex-col rounded-xl ${
        isSelected ? "ring-2 ring-black ring-offset-1" : ""
      }`}
      onClick={onClick}
    >
      <div
        className="relative w-full rounded-xl overflow-hidden bg-gray-200"
        style={{ aspectRatio: ratio }}
      >
        <img
          src={thumb}
          alt={item.title}
          loading={index < EAGER_LOAD_COUNT ? "eager" : "lazy"}
          fetchPriority={index < EAGER_LOAD_COUNT ? "high" : "auto"}
          decoding="async"
          onError={() => setHidden(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
        <img
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
          alt=""
          width={14}
          height={14}
          className="rounded-sm flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <p className="text-[11px] text-gray-400 truncate">
          {item.source || hostname}
        </p>
      </div>
      <p className="text-[12px] font-medium text-gray-700 line-clamp-2 leading-snug px-0.5 mt-0.5">
        {item.title}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidePanel
// ---------------------------------------------------------------------------

interface SidePanelProps {
  results: ImageSearchResultItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function SidePanel({
  results,
  index,
  onClose,
  onPrev,
  onNext,
}: SidePanelProps) {
  const item = results[index];
  const thumb = item.thumbnail?.trim();
  const [fullReady, setFullReady] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFullReady(false);
    if (!item.image) return;
    const img = new window.Image();
    img.src = item.image;
    img.onload = () => setFullReady(true);
    img.onerror = () => setFullReady(false);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [index, item.image]);

  useEffect(() => {
    const measure = () => {
      const h =
        document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      setHeaderH(h);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && panelRef.current) {
      const y = panelRef.current.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  }, [index, headerH]);

  const hostname = (() => {
    try {
      return new URL(item.url).hostname;
    } catch {
      return "";
    }
  })();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  return (
    <motion.div
      ref={panelRef}
      initial={isDesktop ? { x: "100%", opacity: 0 } : { y: 30, opacity: 0 }}
      animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
      exit={isDesktop ? { x: "100%", opacity: 0 } : { y: 30, opacity: 0 }}
      transition={{ 
        type: "spring", 
        damping: 25, 
        stiffness: 200 
      }}
      className="relative w-full h-[75vh] min-h-[480px] bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col z-30 overflow-hidden lg:fixed lg:right-0 lg:top-[var(--header-h)] lg:w-[488px] lg:h-[calc(100vh-var(--header-h))] lg:min-h-0 lg:border-y-0 lg:border-r-0 lg:border-l lg:rounded-none lg:mb-0 lg:shadow-2xl lg:z-40"
      style={{
        "--header-h": `${headerH}px`,
      } as React.CSSProperties}
    >
      {/* Floating Header Controls */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0 z-10">
        <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm border border-gray-200">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-700"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="px-2 text-xs font-medium text-gray-500 tabular-nums">
            {index + 1} / {results.length}
          </div>
          <button
            onClick={onNext}
            disabled={index === results.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-700"
          >
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-600"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Dynamic Content Container */}
      <div className="flex-1 px-4 pb-6 flex flex-col min-h-0">
        
        {/* Unified MD3 Card */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden relative">
          
          {/* Top Half: Dynamic Image Area */}
          <div className="relative bg-gray-50 flex-1 min-h-0 md:p-2 flex items-center justify-center overflow-hidden z-0">
            <style>{`@keyframes sidePanelFade { from { opacity: 0 } to { opacity: 1 } }`}</style>
            
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Thumbnail */}
              {thumb && (
                <img
                  src={thumb}
                  alt={item.title}
                  decoding="async"
                  className="w-full h-full object-cover md:object-contain rounded-t-[24px] md:rounded-xl"
                />
              )}

              {/* Full Image */}
              {fullReady && (
                <img
                  src={item.image}
                  alt={item.title}
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover md:object-contain rounded-t-[24px] md:rounded-xl"
                  style={{ animation: "sidePanelFade 0.4s ease forwards" }}
                />
              )}
            </div>
          </div>

          {/* Bottom Half: Details & Action Buttons */}
          <div className="flex flex-col shrink-0 bg-white border-t border-gray-100 z-10">
            <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 flex flex-col gap-2 md:gap-3">
              <h2 className="text-base md:text-[1.1rem] font-medium text-gray-900 leading-snug">
                {item.title}
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {item.width && item.height && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full">
                    <svg
                      className="w-3.5 h-3.5 opacity-70"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l-5-5m11 5v-4m0 4h-4m4 0l-5-5"
                      />
                    </svg>
                    {item.width} × {item.height}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full max-w-full overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
                    alt=""
                    width={14}
                    height={14}
                    className="rounded-sm flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span className="truncate">{item.source || hostname}</span>
                </span>
              </div>
            </div>
            
            <div className="px-4 md:px-5 pb-4 md:pb-5 pt-1 flex flex-col gap-2 md:gap-2.5 shrink-0">
              <a
                href={item.image}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 md:py-3.5 bg-black text-white rounded-full text-[13px] md:text-sm font-medium text-center hover:bg-gray-800 active:bg-gray-900 transition-colors shadow-sm"
              >
                View Full Image
              </a>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 md:py-3.5 bg-gray-100 text-gray-800 rounded-full text-[13px] md:text-sm font-medium text-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                Visit Page
              </a>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ImageSkeletonGrid
// ---------------------------------------------------------------------------

function ImageSkeletonGrid() {
  const heights = [
    "aspect-square",
    "aspect-video",
    "aspect-[4/3]",
    "aspect-[3/4]",
  ];

  return (
    <div
      className="columns-2 sm:columns-3 md:columns-4 lg:columns-5"
      style={{ columnGap: "0.625rem" }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid inline-block w-full mb-[0.875rem] flex flex-col gap-2"
        >
          <div
            className={`w-full bg-gray-200 rounded-xl animate-pulse ${
              heights[i % 4]
            }`}
          />
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-gray-200 rounded animate-pulse flex-shrink-0" />
            <div className="w-16 h-2.5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}