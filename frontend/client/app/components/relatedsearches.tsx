"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface RelatedSearchesProps {
  keywords: string[];
  currentQuery: string;
}

function stringToColor(str: string): string {
  const palette = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

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
      // Updated to match the instantanswer sidebar styling
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
            prefetch={false} // reduce unnecessary prefetches for suggestions
            // max-w-full prevents the link itself from stretching past the container
            className="group max-w-full"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              // Swapped gray to zinc, added max-w-full to contain the pill
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-white border border-zinc-200/70 rounded-full group-hover:bg-zinc-50 group-hover:border-zinc-300 transition-all max-w-full"
            >
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold uppercase"
                style={{ backgroundColor: stringToColor(keyword) }}
              >
                {keyword[0]}
              </div>
              {/* Replaced whitespace-nowrap with truncate and min-w-0 to fix the overflow */}
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