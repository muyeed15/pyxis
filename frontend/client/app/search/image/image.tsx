'use client';

import { motion } from 'framer-motion';
import type { ImageSearchResultItem } from '../../types';

interface ImageResultsListProps {
  results: ImageSearchResultItem[];
  isLoading?: boolean;
}

export default function ImageResultsList({ results, isLoading = false }: ImageResultsListProps) {
  if (isLoading) {
    return <ImageSkeletonGrid />;
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        <p>No images found.</p>
      </div>
    );
  }

  return (
    <div className="pb-10 w-full">
      {/* Indestructible inline CSS Grid that bypasses Tailwind caching issues */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          columnGap: '1rem',
          rowGap: '1.5rem'
        }}
      >
        {results.map((item, index) => (
          <ImageCard key={`${item.image}-${index}`} item={item} index={index} />
        ))}
      </div>
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
      className="flex flex-col group cursor-pointer w-full"
    >
      {/* Image Container with enforced inline aspect ratio */}
      <a 
        href={item.image} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block w-full rounded-xl overflow-hidden bg-gray-100 mb-2 border border-transparent group-hover:border-gray-200 transition-colors relative"
        style={{ aspectRatio: '4/3' }}
      >
        <img
          src={item.thumbnail || item.image}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </a>

      {/* Metadata / Text Below Image */}
      <div className="flex flex-col px-1">
        <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-xs text-gray-500 hover:underline mb-1"
        >
          <div className="w-4 h-4 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
             <span className="text-[9px] font-bold text-gray-500 uppercase">
                {item.source ? item.source.charAt(0) : '?'}
             </span>
          </div>
          <span className="truncate">{item.source}</span>
        </a>
        <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 hover:underline"
        >
          {item.title}
        </a>
      </div>
    </motion.div>
  );
}

function ImageSkeletonGrid() {
  const skeletonItems = Array.from({ length: 24 });

  return (
    <div className="pb-10 w-full">
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          columnGap: '1rem',
          rowGap: '1.5rem'
        }}
      >
        {skeletonItems.map((_, i) => (
          <div key={`skeleton-${i}`} className="flex flex-col w-full">
            {/* Image Skeleton */}
            <div 
                className="w-full bg-gray-200 rounded-xl animate-pulse mb-3" 
                style={{ aspectRatio: '4/3' }}
            />
            {/* Text Skeletons */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse px-1" />
          </div>
        ))}
      </div>
    </div>
  );
}