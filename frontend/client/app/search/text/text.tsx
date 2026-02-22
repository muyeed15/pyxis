"use client";

import { motion, Variants } from "framer-motion";
import type { TextSearchResultItem } from "../../types";

interface TextResultsListProps {
  results: TextSearchResultItem[];
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20,
      delay: i < 10 ? i * 0.04 : 0,
    },
  }),
};

export default function TextResultsList({ results }: TextResultsListProps) {
  if (!results || results.length === 0) {
    return (
      <div className="p-10 text-center text-gray-400 text-sm">
        No results found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-[680px]">
      {results.map((item, index) => {
        const uniqueKey = `${item.href}-${index}`;

        let hostname = "";
        try {
          hostname = new URL(item.href).hostname.replace(/^www\./, "");
        } catch {
          hostname = "web";
        }

        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

        return (
          <motion.div
            key={uniqueKey}
            variants={itemVariants}
            custom={index}
            initial="hidden"
            animate="visible"
            className="group bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 truncate">
                {hostname}
              </span>
              <span className="text-gray-200 text-xs select-none">·</span>
              <span className="text-xs text-gray-400 truncate hidden sm:block">
                {item.href}
              </span>
            </div>

            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-1.5"
            >
              <h3 className="text-[15px] font-semibold text-gray-900 group-hover:underline underline-offset-2 decoration-gray-400 leading-snug line-clamp-2">
                {item.title}
              </h3>
            </a>

            <p
              className="text-sm text-gray-600 leading-relaxed line-clamp-2"
              dangerouslySetInnerHTML={{ __html: item.body }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
