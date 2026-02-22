"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ImageSearchResultItem } from "../../types";

const PANEL_WIDTH = 380;
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
      style={{
        display: "grid",
        gridTemplateColumns: isOpen
          ? "repeat(auto-fill, minmax(140px, 1fr))"
          : "repeat(5, minmax(0, 1fr))",
        columnGap: "0.625rem",
        rowGap: "0.875rem",
      }}
    >
      {results.map((item, i) => (
        <ImageCard
          key={`${item.image}-${i}`}
          item={item}
          index={i}
          isSelected={selectedIndex === i}
          onClick={() => onSelect(i === selectedIndex ? null : i)}
        />
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

  return (
    <div
      className={`cursor-pointer flex flex-col rounded-xl ${isSelected ? "ring-2 ring-black ring-offset-1" : ""}`}
      onClick={onClick}
    >
      <div
        className="relative w-full rounded-xl overflow-hidden bg-gray-200"
        style={{ aspectRatio: "4/3" }}
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

  // Preload full image silently in the background while thumbnail is visible.
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

  const hostname = (() => {
    try {
      return new URL(item.url).hostname;
    } catch {
      return "";
    }
  })();

  return (
    <motion.div
      initial={{ x: PANEL_WIDTH, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: PANEL_WIDTH, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.8 }}
      className="fixed right-0 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-40 overflow-y-auto overflow-x-hidden"
      style={{
        top: headerH,
        width: PANEL_WIDTH,
        height: `calc(100vh - ${headerH}px)`,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={onNext}
            disabled={index === results.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <span className="text-xs text-gray-400 ml-1 tabular-nums">
            {index + 1} / {results.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Image area — thumbnail underneath, full image fades in on top */}
      <div
        className="relative bg-gray-100 flex items-center justify-center shrink-0"
        style={{ minHeight: 240 }}
      >
        <style>{`@keyframes sidePanelFade { from { opacity: 0 } to { opacity: 1 } }`}</style>

        {/* Thumbnail — always visible immediately */}
        {thumb && (
          <img
            src={thumb}
            alt={item.title}
            decoding="async"
            className="w-full h-auto max-h-[52vh] object-contain"
          />
        )}

        {/* Full image — mounts only after preload completes, fades in over thumbnail */}
        {fullReady && (
          <img
            src={item.image}
            alt={item.title}
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ animation: "sidePanelFade 0.4s ease forwards" }}
          />
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-4 p-4 flex-1">
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          {item.title}
        </p>
        <div className="flex flex-wrap gap-3">
          {item.width && item.height && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
              {item.width} × {item.height}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full max-w-full overflow-hidden">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
              alt=""
              width={14}
              height={14}
              className="rounded flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="truncate">{item.source || hostname}</span>
          </span>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <a
            href={item.image}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium text-center hover:opacity-90 transition-opacity"
          >
            View Full Image
          </a>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium text-center hover:bg-gray-200 transition-colors"
          >
            Visit Page
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ImageSkeletonGrid
// ---------------------------------------------------------------------------

function ImageSkeletonGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        columnGap: "0.625rem",
        rowGap: "0.875rem",
      }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div
            className="w-full bg-gray-200 rounded-xl animate-pulse"
            style={{ aspectRatio: "4/3" }}
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
