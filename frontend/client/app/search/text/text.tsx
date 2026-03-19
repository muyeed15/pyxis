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
      <div className="p-10 text-center text-zinc-500 text-sm bg-zinc-50 rounded-2xl border border-zinc-100/40 max-w-[680px]">
        No results found for your query.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[780px]">
      {results.map((item, index) => {
        const uniqueKey = `${item.href}-${index}`;

        let hostname = "";
        try {
          hostname = new URL(item.href).hostname.replace(/^www\./, "");
        } catch {
          hostname = "web";
        }

        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

        return (
          <motion.div
            key={uniqueKey}
            variants={itemVariants}
            custom={index}
            initial="hidden"
            animate="visible"
            className="group flex flex-col gap-3 bg-zinc-100 border border-zinc-100/40 rounded-3xl px-5 py-[16px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(0,0,0,0.05)] hover:border-zinc-200 relative z-0 hover:z-10"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-50 border border-zinc-200/60 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-zinc-900 truncate">
                  {hostname}
                </span>
                <span className="text-xs text-zinc-500 truncate">
                  {item.href}
                </span>
              </div>
            </div>

            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1"
            >
              <h3 className="text-xl font-bold leading-snug text-zinc-950 group-hover:underline decoration-zinc-400 underline-offset-2 line-clamp-2 tracking-tight">
                {item.title}
              </h3>
            </a>

            <p
              className="text-base text-zinc-700 leading-relaxed line-clamp-2"
              dangerouslySetInnerHTML={{ __html: item.body }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}