'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImageSearchResultItem } from '../../types';

const PANEL_WIDTH = 380;

interface ImageResultsListProps {
  results: ImageSearchResultItem[];
  isLoading?: boolean;
  selectedIndex: number | null;
  onSelect: (i: number | null) => void;
}

export default function ImageResultsList({ results, isLoading = false, selectedIndex, onSelect }: ImageResultsListProps) {
  if (isLoading) return <ImageSkeletonGrid />;

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p className="text-sm">No images found</p>
      </div>
    );
  }

  const isOpen = selectedIndex !== null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isOpen
          ? 'repeat(auto-fill, minmax(140px, 1fr))'
          : 'repeat(auto-fill, minmax(190px, 1fr))',
        columnGap: '0.625rem',
        rowGap: '0.875rem',
        transition: 'grid-template-columns 0.3s ease',
      }}
    >
      {results.map((item, i) => (
        <ImageCard
          key={`${item.image}-${i}`}
          item={item}
          index={i}
          isSelected={selectedIndex === i}
          onClick={() => onSelect(i === selectedIndex ? null : i)}
        />
      ))}
    </div>
  );
}

function ImageCard({ item, index, isSelected, onClick }: {
  item: ImageSearchResultItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [src, setSrc] = useState(item.thumbnail || item.image);

  const hostname = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '120px' }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.015, 0.25) }}
      className={`group cursor-pointer flex flex-col rounded-xl transition-all duration-150 ${isSelected ? 'ring-2 ring-black ring-offset-1' : ''}`}
      onClick={onClick}
    >
      <div className="relative w-full rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
        {status === 'loading' && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        )}
        <img
          src={src}
          alt={item.title}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => {
            if (src === item.thumbnail && item.image && item.image !== item.thumbnail) {
              setSrc(item.image);
            } else {
              setStatus('error');
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
        <img
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
          alt="" className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <p className="text-[11px] text-gray-400 truncate">{item.source || hostname}</p>
      </div>
      <p className="text-[12px] font-medium text-gray-700 line-clamp-2 leading-snug px-0.5 mt-0.5">{item.title}</p>
    </motion.div>
  );
}

export function SidePanel({ results, index, onClose, onPrev, onNext }: {
  results: ImageSearchResultItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = results[index];
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [headerH, setHeaderH] = useState(0);

  useEffect(() => { setImgStatus('loading'); }, [index]);

  useEffect(() => {
    const measure = () => {
      const h = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      setHeaderH(h);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const hostname = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
  const hasPrev = index > 0;
  const hasNext = index < results.length - 1;

  return (
    <motion.div
      initial={{ x: PANEL_WIDTH, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: PANEL_WIDTH, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.8 }}
      className="fixed right-0 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-40 overflow-y-auto overflow-x-hidden"
      style={{ top: headerH, width: PANEL_WIDTH, height: `calc(100vh - ${headerH}px)` }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={onPrev} disabled={!hasPrev}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button onClick={onNext} disabled={!hasNext}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <span className="text-xs text-gray-400 ml-1 tabular-nums">{index + 1} / {results.length}</span>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Image */}
      <div className="relative bg-gray-50 flex items-center justify-center shrink-0" style={{ minHeight: 240 }}>
        {imgStatus === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        )}
        {imgStatus === 'error' && (
          <div className="flex flex-col items-center gap-2 text-gray-300 py-14">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span className="text-sm">Image unavailable</span>
          </div>
        )}
        <img
          src={item.image}
          alt={item.title}
          className={`w-full h-auto max-h-[52vh] object-contain transition-opacity duration-200 ${imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgStatus('loaded')}
          onError={() => setImgStatus('error')}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-4 p-4 flex-1">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</p>

        <div className="flex flex-wrap gap-3">
          {item.width && item.height && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
              </svg>
              {item.width} × {item.height}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full max-w-full overflow-hidden">
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
              alt="" className="w-3.5 h-3.5 rounded flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="truncate">{item.source || hostname}</span>
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <a href={item.image} target="_blank" rel="noopener noreferrer"
            className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium text-center hover:opacity-90 transition-opacity">
            View Full Image
          </a>
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium text-center hover:bg-gray-200 transition-colors">
            Visit Page
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function ImageSkeletonGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
      columnGap: '0.625rem',
      rowGap: '0.875rem',
    }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="w-full bg-gray-200 rounded-xl animate-pulse" style={{ aspectRatio: '4/3' }} />
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-gray-200 rounded animate-pulse flex-shrink-0" />
            <div className="w-16 h-2.5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}