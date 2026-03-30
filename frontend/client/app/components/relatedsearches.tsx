"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface RelatedSearchesProps {
  keywords: string[];
  currentQuery: string;
}

// 1. Your custom palette with the syntax fixed
const palette = [
  "#000000", // Pure Black
  "#78716C", // Stone 500 (Medium-Light Grey)
  "#27272A", // Zinc 800 (Dark Grey)
  "#A1A1AA", // Zinc 400 (Light Silver)
  "#57534E", // Stone 600 (Medium-Dark Grey)
  "#52525B", // Zinc 600 (Medium Grey)
  "#3F3F46", // Zinc 700 (Medium-Dark Grey)
];

export default function RelatedSearches({
  keywords,
  currentQuery,
}: RelatedSearchesProps) {
  if (!keywords || keywords.length === 0) return null;

  return (
    <motion.div
      key={currentQuery}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-3xl border border-zinc-100/60 p-6 shadow-sm hover:shadow-md hover:border-zinc-200/80 transition-all duration-300"
    >
      <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-zinc-500"
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
        Related Searches
      </h3>

      <div className="flex flex-wrap gap-2.5">
        {keywords.slice(0, 8).map((keyword, index) => (
          <Link
            key={index}
            href={`/search/text?q=${encodeURIComponent(keyword)}`}
            prefetch={false}
            className="group max-w-full"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-white border border-zinc-200/70 rounded-full group-hover:bg-zinc-50 group-hover:border-zinc-300 transition-all max-w-full"
            >
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold uppercase"
                // 2. Applies the color perfectly using the index cycle
                style={{ backgroundColor: palette[index % palette.length] }}
              >
                {keyword[0]}
              </div>
              <span className="text-sm text-zinc-700 truncate min-w-0">
                {keyword}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}