'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ImageSearchResultItem } from '../../types';

interface ImageResultsListProps {
  results: ImageSearchResultItem[];
}

export default function ImageResultsList({ results }: ImageResultsListProps) {
  const resultChunks = useMemo(() => {
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < results.length; i += chunkSize) {
      chunks.push(results.slice(i, i + chunkSize));
    }
    return chunks;
  }, [results]);

  if (!results || results.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        <p>No images found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-10">
      {resultChunks.map((chunk, chunkIndex) => (
        <div 
          key={`chunk-${chunkIndex}`} 
          className="w-full columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 mb-4"
        >
          {chunk.map((item, itemIndex) => {
            
            const globalIndex = (chunkIndex * 20) + itemIndex;
            
            return (
              <div key={`${item.image}-${globalIndex}`} className="break-inside-avoid mb-4">
                <ImageCard item={item} index={globalIndex} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ImageCard({ item, index }: { item: ImageSearchResultItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }} 
      transition={{ duration: 0.4 }} 
      className="relative group rounded-xl overflow-hidden bg-gray-100"
    >
      <a href={item.image} target="_blank" rel="noopener noreferrer" className="block w-full">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-auto min-h-[200px] object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </a>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
        <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-gray-300 truncate hover:underline pointer-events-auto"
        >
          {item.source}
        </a>
        <a 
            href={item.image} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white text-sm font-medium leading-tight line-clamp-2 hover:underline pointer-events-auto"
        >
          {item.title}
        </a>
      </div>
    </motion.div>
  );
}