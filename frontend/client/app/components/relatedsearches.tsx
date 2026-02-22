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
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg
          className="w-4 h-4"
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

      <div className="flex flex-wrap gap-2">
        {keywords.slice(0, 8).map((keyword, index) => (
          <Link
            key={index}
            href={`/search/text?q=${encodeURIComponent(keyword)}`}
            prefetch={false} // reduce unnecessary prefetches for suggestions
            className="group"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold uppercase"
                style={{ backgroundColor: stringToColor(keyword) }}
              >
                {keyword[0]}
              </div>
              <span className="text-sm text-gray-700 whitespace-nowrap">
                {keyword}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
