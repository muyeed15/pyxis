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
      <div className="p-10 text-center text-gray-400 text-sm">
        No books found.
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // Increased top padding slightly to give the covers more breathing room
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-14 md:gap-x-6 md:gap-y-16 pt-10"
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
            className="group block outline-none"
          >
            {/* Clean, Expressive 3 Card Surface: 
              Soft gray background, pill-like radius, subtle transition to white on hover 
            */}
            <div className="relative h-full bg-[#f8f9fa] rounded-[32px] p-5 pb-7 flex flex-col items-center border border-gray-100/80 shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 ease-out">
              
              {/* Book Cover - Enhanced Elevation:
                Using a double-shadow technique for a hyper-realistic 3D lift 
              */}
              <div className="w-full max-w-[130px] md:max-w-[150px] aspect-[2/3] -mt-12 mb-5 rounded-md overflow-hidden bg-gray-200 shadow-[0_12px_24px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.06)] group-hover:-translate-y-2 group-hover:shadow-[0_20px_32px_rgba(0,0,0,0.16),0_6px_12px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out shrink-0 relative ring-1 ring-black/5">
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; 
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 p-2 text-center text-xs">
                    No Cover
                  </div>
                )}
                
                {/* Spine lighting detail */}
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/20 to-transparent mix-blend-overlay" />
                {/* Subtle glossy overlay detail for the cover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10" />
              </div>

              {/* Typography - Refined contrast and spacing */}
              <div className="text-center px-1 flex flex-col flex-1 justify-between w-full">
                <div>
                  <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 leading-snug line-clamp-2 font-serif tracking-tight mb-1.5">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-[13px] md:text-[14px] text-gray-500 line-clamp-1 font-medium">
                      {book.author}
                    </p>
                  )}
                </div>
                {book.year && (
                  <span className="inline-block mt-4 text-[11px] uppercase tracking-[0.1em] font-bold text-gray-400">
                    {book.year}
                  </span>
                )}
              </div>
              
            </div>
          </motion.a>
        );
      })}
    </motion.div>
  );
}