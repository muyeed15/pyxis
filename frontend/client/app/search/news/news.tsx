"use client";

import { useState , useEffect} from "react";
import { motion } from "framer-motion";
import type { NewsSearchResultItem } from "../../types";

interface NewsResultsProps {
  results: NewsSearchResultItem[];
}
const ArticleImage = ({ src, alt, articleUrl }: { src?: string; alt: string; articleUrl: string }) => {
  let hostname = "web";
  try {
    hostname = new URL(articleUrl).hostname.replace(/^www\./, "");
  } catch (e) {}

  const fallbackLogo = `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`;
  
  const [imgSrc, setImgSrc] = useState(src || fallbackLogo);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackLogo);
    setHasFailed(false);
  }, [src, fallbackLogo]);
  
  if (hasFailed) {
    return (
      <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">
        <svg className="w-8 h-8 opacity-40" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 13.11V16h10v-4.11l-3.23-3.23c-.39-.39-1.03-.39-1.42 0L7 13.11z"/></svg>
      </div>
    );
  }

  const isLogo = imgSrc === fallbackLogo;

  return (
    <div className="w-full h-full relative bg-zinc-50 flex items-center justify-center overflow-hidden">
      {/* Background skeleton icon just in case loading is slow */}
      <svg className="absolute w-8 h-8 opacity-10 text-zinc-500 z-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 13.11V16h10v-4.11l-3.23-3.23c-.39-.39-1.03-.39-1.42 0L7 13.11z"/></svg>
      
      <img
        src={imgSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`w-full h-full relative z-10 transition-transform duration-500 group-hover:scale-105 ${isLogo ? 'object-contain p-6 opacity-70' : 'object-cover'}`}
        onError={() => {
          if (imgSrc !== fallbackLogo) {
            setImgSrc(fallbackLogo);
          } else {
            setHasFailed(true); 
          }
        }}
      />
    </div>
  );
};

export default function NewsResultsList({ results }: NewsResultsProps) {
  if (!results || results.length === 0) {
    return (
      <div className="p-10 text-center text-zinc-500 text-sm bg-zinc-50 rounded-2xl border border-zinc-100 max-w-[680px]">
        No news results found for your query.
      </div>
    );
  }

  const featuredArticle = results[0];
  const sideArticles = results.slice(1, 4);
  const remainingLatestNews = results.slice(4);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
      
      if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="flex flex-col max-w-[1000px] w-full gap-10">
      
      {/* SECTION 1: TOP HEADLINES */}
      <section>
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-950 tracking-tighter mb-8 px-1">
          Top Headlines
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          
          {/* Left: Featured Article */}
          {featuredArticle && (
            <motion.a 
              href={featuredArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col gap-5 bg-zinc-100 border border-zinc-100 p-6 rounded-[32px] hover:shadow-lg hover:border-zinc-200 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                   <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(featuredArticle.url).hostname}&sz=64`} 
                      alt=""
                      className="w-5 h-5 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                   />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{featuredArticle.source}</p>
                  <p className="text-xs text-zinc-500">Source</p>
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold leading-tight text-zinc-950 group-hover:underline decoration-zinc-400 underline-offset-4 line-clamp-3 tracking-tight">
                {featuredArticle.title}
              </h2>

              <div className="flex items-center gap-2.5 text-sm text-zinc-500">
                <span className="bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full font-semibold text-xs tracking-wide">Top Story</span>
                <span>•</span>
                {/* suppressHydrationWarning fixes the React error for server/client timezone mismatch */}
                <span suppressHydrationWarning>{formatDate(featuredArticle.date)}</span>
              </div>

              <div className="w-full aspect-[16/10] overflow-hidden rounded-2xl mt-1 border border-zinc-100 shadow-inner bg-zinc-100">
                 <ArticleImage key={featuredArticle.url} src={featuredArticle.image} alt={featuredArticle.title} articleUrl={featuredArticle.url} />
              </div>
            </motion.a>
          )}

          {/* Right: Side Articles List */}
          <div className="flex flex-col gap-5 lg:pt-1">
            {sideArticles.map((article, index) => (
              <motion.a
                key={article.url + index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col-reverse sm:flex-row gap-4 sm:items-center bg-zinc-100 hover:bg-zinc-200/60 border border-zinc-100/70 p-4 rounded-3xl transition-colors duration-300"
              >
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  <h3 className="text-lg font-bold leading-snug text-zinc-950 group-hover:underline decoration-zinc-400 underline-offset-2 line-clamp-2 pr-2">
                    {article.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span className="font-semibold text-zinc-800">{article.source}</span>
                    <span>•</span>
                    <span suppressHydrationWarning>{formatDate(article.date)}</span>
                  </div>
                </div>

                <div className="w-full sm:w-[130px] h-[160px] sm:h-[90px] shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-inner">
                   <ArticleImage key={article.url} src={article.image} alt={article.title} articleUrl={article.url} />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: OTHER NEWS */}
      {remainingLatestNews.length > 0 && (
        <section className="mt-8 pt-10 border-t border-zinc-100">
          <h2 className="text-3xl font-extrabold text-zinc-950 tracking-tighter mb-8 px-1">
            Latest Updates
          </h2>

          <div className="flex flex-col gap-6">
            {remainingLatestNews.map((article, index) => (
              <motion.a
                key={article.url + index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4 }}
                className="group flex flex-col md:flex-row gap-5 bg-zinc-100 border border-zinc-100 rounded-3xl p-5 hover:shadow-md hover:border-zinc-200 transition-all duration-300 max-w-[780px]"
              >
                <div className="w-full md:w-[180px] h-[180px] md:h-[120px] shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100 shadow-inner">
                   <ArticleImage src={article.image} alt={article.title} articleUrl={article.url} />
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-0.5">
                    <span className="font-semibold text-zinc-800">{article.source}</span>
                    <span>•</span>
                    <span suppressHydrationWarning>{formatDate(article.date)}</span>
                  </div>

                  <h3 className="text-xl font-bold leading-snug text-zinc-950 group-hover:underline decoration-zinc-400 underline-offset-2 line-clamp-2 tracking-tight">
                    {article.title}
                  </h3>

                  <p 
                    className="text-base text-zinc-700 line-clamp-2 mt-0.5"
                    dangerouslySetInnerHTML={{ __html: article.body }}
                  />
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}