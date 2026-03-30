"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface LibraryCategoriesProps {
  currentQuery: string;
}

// Expanded to include a rich mix of popular collections and specific genres
const POPULAR_CATEGORIES = [
  "Bestsellers",
  "Fiction",
  "Mystery & Thriller",
  "Design",
  "Historical",
  "Science Fiction",
  "Philosophy",
  "Artificial Intelligence",
  "Programming Languages", // <-- Changed from "Python Programming"
  "Classic Literature",
  "Art & Photography",
];

export default function LibraryCategories({ currentQuery }: LibraryCategoriesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full mb-4 px-1"
    >
      <div className="flex items-center gap-3 mb-4">
        <svg 
          className="w-4 h-4 text-zinc-800" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
          />
        </svg>
        <h3 className="text-[25px] font-sherif text-zinc-800 tracking-wide">
          Explore the Library
        </h3>
      </div>

      <div className="flex overflow-x-auto no-scrollbar pt-3 pb-8 -mx-4 px-4 md:-mx-8 md:px-8 lg:mx-0 lg:px-0 lg:flex-wrap gap-3 md:gap-4 lg:gap-5">
        {POPULAR_CATEGORIES.map((category, index) => {
          const isActive = currentQuery.toLowerCase() === category.toLowerCase();

          return (
            <Link
              key={index}
              href={`/search/book?q=${encodeURIComponent(category)}`}
              prefetch={false}
              className="outline-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-center px-4 py-2 md:px-5 md:py-2.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                  isActive 
                    ? "bg-zinc-800 text-white border border-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:text-zinc-900 hover:border-zinc-300"
                }`}
              >
                {/* Responsive text: 13px on mobile, 14px on tablet/desktop */}
                <span className="text-[13px] md:text-[14px] font-medium tracking-wide">
                  {category}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}