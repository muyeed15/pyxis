"use client";

import { motion, Variants } from "framer-motion";
import type { BookSearchResultItem } from "../../types";

interface BookResultsListProps {
  results: BookSearchResultItem[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 20 },
  },
};

export default function BookResultsList({ results }: BookResultsListProps) {
  if (!results || results.length === 0) {
    return (
      <div className="p-10 text-center text-zinc-400 text-sm">
        No books found.
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-20 md:gap-x-6 md:gap-y-24 pt-16 md:pt-20"
    >
      {results.map((book, index) => {
        const uniqueKey = `${book.url || book.title}-${index}`;

        return (
          <motion.a
            key={uniqueKey}
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            variants={itemVariants}
            className="group block h-full outline-none"
          >
            {/* CARD CONTAINER */}
            <div className="relative h-full w-full max-w-[180px] md:max-w-[240px] mx-auto bg-zinc-100 rounded-[28px] md:rounded-[32px] px-3 pb-5 pt-0 md:p-5 md:pb-7 flex flex-col items-center border border-zinc-200/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out">
              
              {/* BOOK COVER */}
              <div className="w-[75%] md:w-[82%] max-w-[140px] md:max-w-[180px] aspect-[2/3] -mt-16 md:-mt-20 mb-3 md:mb-5 rounded-md overflow-hidden bg-zinc-200 shadow-[0_12px_24px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.06)] group-hover:-translate-y-2 group-hover:shadow-[0_20px_32px_rgba(0,0,0,0.16),0_6px_12px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out shrink-0 relative ring-1 ring-black/5 flex items-center justify-center">
                
                {/* FALLBACK (z-0) */}
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 p-2 text-center text-[11px] md:text-xs font-medium z-0">
                  No Cover
                </div>

                {/* IMAGE (z-10) */}
                {book.image && (
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-full object-cover relative z-10"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                
                {/* OVERLAYS (z-20) */}
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/20 to-transparent mix-blend-overlay z-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 z-20 pointer-events-none" />
              </div>

              {/* TYPOGRAPHY */}
              <div className="text-center px-1 flex flex-col flex-1 justify-between w-full">
                <div>
                  <h3 
                    className="text-[14px] md:text-[18px] font-bold text-zinc-900 leading-tight md:leading-snug line-clamp-1 font-serif tracking-tight mb-0.5 md:mb-1.5"
                    title={book.title}
                  >
                    {book.title}
                  </h3>
                  {book.author ? (
                    <p className="text-[12px] md:text-[14px] text-zinc-500 line-clamp-1 font-medium">
                      {book.author}
                    </p>
                  ) : (
                    <div className="h-[18px] md:h-[21px]" />
                  )}
                </div>
                {book.year ? (
                  <span className="inline-block mt-3 md:mt-4 text-[10px] md:text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-400">
                    {book.year}
                  </span>
                ) : (
                  <div className="mt-3 md:mt-4 h-[15px] md:h-[16px]" />
                )}
              </div>
              
            </div>
          </motion.a>
        );
      })}
    </motion.div>
  );
}