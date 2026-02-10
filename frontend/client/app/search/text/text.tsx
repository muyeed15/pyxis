'use client'; 

import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { TextSearchResultItem } from './types';

interface TextResultsListProps {
  results: TextSearchResultItem[];
}

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  },
  visible: (index: number) => ({
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring', 
      stiffness: 50, 
      damping: 20,
      delay: index < 10 ? index * 0.05 : 0 
    }
  })
};

export default function TextResultsList({ results }: TextResultsListProps) {
  if (!results || results.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        <p>No results found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[650px]">
      {results.map((item, index) => {
        const uniqueKey = `${item.href}-${index}`;
        
        let hostname = "";
        try {
            hostname = new URL(item.href).hostname;
        } catch(e) { 
            hostname = "web"; 
        }

        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

        return (
          <motion.div 
            key={uniqueKey} 
            className="group"
            variants={itemVariants}
            
            custom={index}
            
            initial="hidden"
            whileInView="visible"
            viewport={{ 
              once: true, 
              amount: 0.2,
              margin: "0px 0px -50px 0px"
            }}
          >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <img 
                        src={faviconUrl} 
                        alt="" 
                        className="w-[18px] h-[18px] object-contain opacity-80"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-gray-900 font-medium dark:text-gray-200 truncate">{hostname}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">{item.href}</span>
                </div>
            </div>
            
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="block mb-1 group-hover:underline decoration-black dark:decoration-white decoration-1">
             <h3 className="text-xl text-black font-medium dark:text-white leading-tight">
                {item.title}
             </h3>
            </a>

            <div 
              className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2" 
              dangerouslySetInnerHTML={{ __html: item.body }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}