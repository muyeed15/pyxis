'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface ImageCategoryBarProps {
  keywords: string[];
  currentQuery: string;
  activeTags: string[]; 
}

export default function ImageCategoryBar({ keywords, currentQuery, activeTags }: ImageCategoryBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoriesWithImages, setCategoriesWithImages] = useState<{term: string, img: string | null}[]>([]);

  const getTagUrl = (tag: string, action: 'add' | 'remove') => {
    const params = new URLSearchParams(searchParams.toString());
    let newTags = [...activeTags];

    if (action === 'remove') {
      newTags = newTags.filter(t => t !== tag);
    } else {
      if (!newTags.includes(tag)) newTags.push(tag);
    }

    if (newTags.length > 0) {
      params.set('tags', newTags.join(','));
    } else {
      params.delete('tags');
    }

    if (currentQuery) params.set('q', currentQuery);
    
    return `/search/image?${params.toString()}`;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      const filtered = keywords
        .filter(k => 
          k.toLowerCase() !== currentQuery.toLowerCase() && 
          !activeTags.includes(k)
        )
        .slice(0, 12);
      
      // 2. Fetch thumbnails
      const results = await Promise.all(filtered.map(async (term) => {
        try {
          const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=${encodeURIComponent(term)}&gpslimit=1&prop=pageimages&pithumbsize=100&format=json&origin=*`);
          const data = await res.json();
          const page = Object.values(data.query?.pages || {})[0] as any;
          return { term, img: page?.thumbnail?.source || null };
        } catch {
          return { term, img: null };
        }
      }));

      if (isMounted) {
        setCategoriesWithImages(results);
      }
    };

    fetchImages();

    return () => { isMounted = false; };
  }, [keywords, currentQuery, activeTags]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      
      {/* 1. ORIGINAL QUERY PILL */}
      {currentQuery && (
        <div className="flex-shrink-0 flex items-center gap-2 bg-black text-white pl-4 pr-3 py-1 rounded-lg h-[40px] shadow-sm">
          <span className="text-sm font-medium capitalize">{currentQuery}</span>
          <button 
            onClick={() => router.push('/search/image')} 
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            title="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* 2. ACTIVE TAG PILLS */}
      {activeTags.map((tag, i) => (
        <div key={`tag-${i}`} className="flex-shrink-0 flex items-center gap-2 bg-black text-white pl-4 pr-3 py-1 rounded-lg h-[40px] shadow-sm animate-in fade-in slide-in-from-left-2">
          <span className="text-sm font-medium capitalize">{tag}</span>
          <Link 
            href={getTagUrl(tag, 'remove')}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            scroll={false}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Link>
        </div>
      ))}

      {/* Vertical Divider */}
      {(currentQuery || activeTags.length > 0) && categoriesWithImages.length > 0 && (
         <div className="h-6 w-[1px] bg-gray-200 mx-1 flex-shrink-0" />
      )}

      {/* 3. SUGGESTIONS (White Chips) */}
      {categoriesWithImages.map((cat, i) => (
        <Link
          key={i}
          href={getTagUrl(cat.term, 'add')} 
          scroll={false}
          className="
            flex-shrink-0 flex items-center gap-3 pl-1 pr-4 py-1 
            bg-white border border-gray-200 rounded-lg h-[40px] 
            hover:bg-gray-50 hover:border-gray-300 transition-all group
          "
        >
          <div className="w-8 h-8 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 relative">
            {cat.img ? (
              <img src={cat.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold uppercase"
                style={{ backgroundColor: stringToColor(cat.term) }}
              >
                {cat.term[0]}
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{cat.term}</span>
        </Link>
      ))}
    </div>
  );
}

function stringToColor(str: string) {
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}