"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface RelatedSearchesProps {
  keywords: string[];
  currentQuery: string;
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

      <div className="space-y-2">
        {keywords.slice(0, 8).map((keyword, index) => (
          <Link
            key={index}
            href={`/search/text?q=${encodeURIComponent(keyword)}&safesearch=on`}
            className="block group"
          >
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg
                className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
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
              <span className="text-sm text-gray-700 group-hover:text-black transition-colors line-clamp-1">
                {keyword}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}