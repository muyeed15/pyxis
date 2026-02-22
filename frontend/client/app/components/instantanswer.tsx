"use client";

import { motion } from "framer-motion";
import { useState } from "react";

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
  const [imageError, setImageError] = useState(false);

  if (!answer || !imageUrl) return null;

  return (
    <motion.div
      key={query}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 130, damping: 22, delay: 0.05 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full overflow-hidden bg-gray-50"
      >
        {!imageError ? (
          <img
            src={imageUrl}
            alt={query}
            className="w-full h-auto object-contain"
            loading="lazy"
            fetchPriority="low"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
            <svg
              className="w-12 h-12 opacity-30"
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
          </div>
        )}

        <motion.a
          href={`https://wikipedia.org/wiki/${encodeURIComponent(query)}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-500 text-[10px] font-medium px-2.5 py-1 rounded-full hover:text-gray-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
            <path d="M11 7h2v2h-2zm0 4h2v6h-2z" />
          </svg>
          Wikipedia
        </motion.a>
      </motion.div>

      <div className="px-5 pt-4 pb-5">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.35 }}
          className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2.5"
        >
          Quick Answer
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.4, ease: "easeOut" }}
          className="text-sm text-gray-500 leading-relaxed"
        >
          {answer}
        </motion.p>
      </div>
    </motion.div>
  );
}
