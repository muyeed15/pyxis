"use client";

import { motion } from "framer-motion";

interface InstantAnswerProps {
  answer: string;
  imageUrl: string | null;
  query: string;
}

export default function InstantAnswer({
  answer,
  imageUrl,
  query,
}: InstantAnswerProps) {
  if (!answer) return null;

  return (
    <motion.div
      key={query}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
    >
      {imageUrl && (
        <div className="w-full bg-gray-50 relative group">
          <img
            src={imageUrl}
            alt={query}
            className="w-full h-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute bottom-0 right-0 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={`https://wikipedia.org/wiki/${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
                <path d="M11 7h2v2h-2zm0 4h2v6h-2z" />
              </svg>
              Wikipedia
            </a>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Instant Answer
          </h3>
          <a
            href="https://duckduckgo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
              <path d="M11 7h2v2h-2zm0 4h2v6h-2z" />
            </svg>
            DuckDuckGo
          </a>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">
          {answer}
        </p>
      </div>
    </motion.div>
  );
}