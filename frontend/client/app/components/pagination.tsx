'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Pagination() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  const pages = [1, 2, 3, 4, 5];

  return (
    <div className="py-8 flex justify-center items-center gap-2 mt-4 select-none">
      {pages.map((page) => {
        const isActive = page === currentPage;
        
        return (
          <Link
            key={page}
            href={`/search/text?q=${encodeURIComponent(q)}&page=${page}`}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
              ${isActive 
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-md scale-110' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }
            `}
          >
            {page}
          </Link>
        );
      })}
      
      <Link
        href={`/search/text?q=${encodeURIComponent(q)}&page=${currentPage + 1}`}
        className="ml-2 px-4 py-2 rounded-full text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
      >
        Next
      </Link>
    </div>
  );
}