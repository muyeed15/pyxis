'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

interface SearchTabsProps {
  currentTab?: string;
  customPadding?: string;
}

function SearchTabsContent({ 
  currentTab = 'text', 
  customPadding = 'px-4 md:px-0' 
}: SearchTabsProps) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [searchParams]);

  const makeLink = (type: string) => `/search/${type}?q=${encodeURIComponent(q)}`;

  const tabs = [
    { 
      name: 'All', 
      path: 'text',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    },
    { 
      name: 'Images', 
      path: 'image',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    },
    { 
      name: 'Videos', 
      path: 'video',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
    },
    { 
      name: 'News', 
      path: 'news',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
    },
    { 
      name: 'Books', 
      path: 'book',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    },
  ];

  return (
    <div className="w-full relative">
      <div className={`max-w-[1200px] mx-auto ${customPadding}`}>
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.path;
            
            return (
              <Link
                key={tab.path}
                href={makeLink(tab.path)}
                onClick={() => {
                   if (!isActive) setIsLoading(true);
                }}
                className={`
                  relative py-3 text-sm font-medium transition-colors duration-200 ease-out select-none whitespace-nowrap
                  ${isActive 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
                  }
                `}
              >
                <span className={`
                  flex items-center gap-2 pb-[1.5px] border-b-2
                  ${isActive ? 'border-black dark:border-white' : 'border-transparent'}
                `}>
                  <span className={isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}>
                    {tab.icon}
                  </span>
                  <span>{tab.name}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-transparent overflow-hidden z-50">
           <motion.div
            className="h-full bg-blue-600 dark:bg-blue-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.8, 
              ease: "linear" 
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function SearchTabs(props: SearchTabsProps) {
  return (
    <Suspense fallback={<div className="h-12 w-full bg-transparent" />}>
      <SearchTabsContent {...props} />
    </Suspense>
  );
}