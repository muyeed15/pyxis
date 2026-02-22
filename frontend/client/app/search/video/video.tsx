"use client";

import { motion } from "framer-motion";
import type { VideoSearchResultItem } from "../../types";

interface VideoResultsListProps {
  results: VideoSearchResultItem[];
  isLoading?: boolean;
}

const getThumbnail = (item: VideoSearchResultItem) => {
  return typeof item.images === "string"
    ? item.images
    : item.images?.large ||
        item.images?.medium ||
        item.images?.small ||
        "/images/placeholder-video.svg";
};

const formatViews = (views?: number) => {
  if (!views) return null;
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views} views`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString?.split("T")[0] || null;
  }
};

const PlayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export default function VideoResultsList({
  results,
  isLoading = false,
}: VideoResultsListProps) {
  if (isLoading) return <VideoSkeletonGrid />;
  if (!results || results.length === 0)
    return (
      <div className="p-10 text-center text-gray-500">No videos found.</div>
    );

  const canBuildBento = results.length >= 6;

  if (canBuildBento) {
    const heroVideo = results[0];
    const listVideos = results.slice(1, 4);
    const shortsVideos = results.slice(4, 6);
    const remainingVideos = results.slice(6);

    return (
      <div className="flex flex-col gap-8 pb-12 w-full max-w-[1600px] mx-auto">
        {/* --- BENTO BOX --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem",
            width: "100%",
          }}
        >
          {/* 1. Hero Video */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <HeroCard item={heroVideo} />
          </div>

          {/* 2. Top Results List  */}
          <div
            style={{
              backgroundColor: "#f3f6f8",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              border: "0.5px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                color: "#1e293b",
                fontSize: "14px",
                marginBottom: "1rem",
              }}
            >
              Top Results
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                flexGrow: 1,
                justifyContent: "flex-start",
              }}
            >
              {listVideos.map((item, idx) => (
                <ListCard key={idx} item={item} />
              ))}
            </div>
          </div>

          {/* 3. Shorts Carousel */}
          <div
            style={{
              backgroundColor: "#f3f6f8",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              border: "0.5px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}
              >
                Shorts
              </h3>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                height: "100%",
              }}
            >
              {shortsVideos.map((item, idx) => (
                <ShortCard key={idx} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* --- BOTTOM GRID SECTION (5 columns) --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "1.5rem",
            width: "100%",
            marginTop: "0.5rem",
          }}
        >
          {remainingVideos.map((item, idx) => (
            <StandardCard key={idx} item={item} />
          ))}
        </div>
      </div>
    );
  }

  // Fallback Grid if < 6 results – also 5 columns
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "1.5rem",
        width: "100%",
        paddingBottom: "2.5rem",
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      {results.map((item, idx) => (
        <StandardCard key={idx} item={item} />
      ))}
    </div>
  );
}

function HeroCard({ item }: { item: VideoSearchResultItem }) {
  return (
    <a
      href={item.content}
      target="_blank"
      rel="noopener noreferrer"
      className="group hover:shadow-md transition-shadow"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#f0f3f8",
        borderRadius: "16px",
        overflow: "hidden",
        border: "0.5px solid rgba(0,0,0,0.1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* 16:9 Aspect Ratio Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "70%",
          backgroundColor: "#eaf4ff",
        }}
      >
        <img
          src={getThumbnail(item)}
          alt={item.title}
          className="transition-transform duration-500 group-hover:scale-105"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={(e) =>
            (e.currentTarget.src =
              "https://picsum.photos/seed/fallback/640/360")
          }
        />

        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        {item.duration && (
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white">
            {item.duration}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flexGrow: 1,
        }}
      >
        <h2
          className="group-hover:text-blue-600 transition-colors"
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: "1.2",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "12px",
            fontWeight: 500,
            color: "#64748b",
            marginTop: "auto",
            paddingTop: "0.5rem",
          }}
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(item.content || "https://youtube.com").hostname}&sz=32`}
            style={{ width: "16px", height: "16px", borderRadius: "50%" }}
            alt="icon"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          {item.publisher || "YouTube"}
          <span>•</span>
          {formatViews(item.statistics?.viewCount)}
        </div>
      </div>
    </a>
  );
}

function ListCard({ item }: { item: VideoSearchResultItem }) {
  return (
    <a
      href={item.content}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        background: "transparent",
        border: "0.5px solid rgba(0,0,0,0.08)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        borderRadius: "8px",
        padding: "0.5rem",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          width: "120px",
          flexShrink: 0,
          paddingTop: "22%",
          backgroundColor: "#e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <img
          src={getThumbnail(item)}
          alt={item.title}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayIcon className="w-5 h-5 text-white ml-0.5 opacity-90" />
        </div>
        {item.duration && (
          <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-bold text-white">
            {item.duration}
          </div>
        )}
      </div>
      {/* Text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <h4
          className="group-hover:text-blue-600"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#0f172a",
            lineHeight: "1.3",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </h4>
        <span
          style={{
            fontSize: "11px",
            color: "#64748b",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.publisher || "Source"}{" "}
          {item.statistics?.viewCount
            ? `• ${formatViews(item.statistics.viewCount)}`
            : ""}
        </span>
      </div>
    </a>
  );
}

function ShortCard({ item }: { item: VideoSearchResultItem }) {
  return (
    <a
      href={item.content}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "177.77%",
        backgroundColor: "#0f172a",
        borderRadius: "12px",
        overflow: "hidden",
        border: "none",
      }}
    >
      <img
        src={getThumbnail(item)}
        alt={item.title}
        className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        className="bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <PlayIcon className="w-8 h-8 text-white/90 mb-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform shadow-lg" />
        <h4
          style={{
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: "1.3",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </h4>
        <span
          style={{
            color: "#cbd5e1",
            fontSize: "10px",
            marginTop: "4px",
            fontWeight: 500,
          }}
        >
          {formatViews(item.statistics?.viewCount) || "Short"}
        </span>
      </div>
    </a>
  );
}

function StandardCard({ item }: { item: VideoSearchResultItem }) {
  return (
    <a
      href={item.content}
      target="_blank"
      rel="noopener noreferrer"
      className="group w-full"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        border: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          backgroundColor: "#f1f5f9",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <img
          src={getThumbnail(item)}
          alt={item.title}
          className="transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <PlayIcon className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
        {item.duration && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[11px] font-bold text-white">
            {item.duration}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          padding: "0 0.25rem",
          minWidth: 0,
        }}
      >
        <h3
          className="group-hover:text-blue-600 transition-colors"
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#0f172a",
            lineHeight: "1.2",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "12px",
            color: "#64748b",
            marginTop: "2px",
          }}
        >
          {item.publisher && (
            <span
              style={{
                fontWeight: 500,
                color: "#475569",
                maxWidth: "100px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.publisher}
            </span>
          )}
          {(item.statistics?.viewCount || item.published) && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.25rem",
              }}
            >
              {item.publisher && <span>•</span>}
              {formatViews(item.statistics?.viewCount)}
              {item.statistics?.viewCount && item.published && <span>•</span>}
              {formatDate(item.published)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function VideoSkeletonGrid() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        paddingBottom: "2.5rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          width: "100%",
        }}
      >
        <div
          className="bg-slate-200 rounded-2xl animate-pulse"
          style={{ width: "100%", paddingTop: "56.25%" }}
        />
        <div
          className="bg-slate-50 rounded-2xl p-4"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-200 rounded-xl animate-pulse"
              style={{ height: "80px" }}
            />
          ))}
        </div>
        <div
          className="bg-slate-50 rounded-2xl p-4"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div
            className="bg-slate-200 rounded-xl animate-pulse"
            style={{ width: "100%", paddingTop: "177.77%" }}
          />
          <div
            className="bg-slate-200 rounded-xl animate-pulse"
            style={{ width: "100%", paddingTop: "177.77%" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1.5rem",
          width: "100%",
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <div
              className="bg-slate-200 rounded-xl animate-pulse"
              style={{ width: "100%", paddingTop: "56.25%" }}
            />
            <div
              className="bg-slate-200 rounded animate-pulse"
              style={{ width: "75%", height: "1rem" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
