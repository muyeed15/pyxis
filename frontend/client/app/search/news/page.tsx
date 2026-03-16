import type { Metadata } from "next";
import NewsPageWrapper from "./pagewrapper";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = searchParams.q;
  return {
    title: typeof query === "string" ? `${query} - Pyxis News` : "Pyxis News",
  };
}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default async function NewsSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";

  let mainData = null;
  let relatedKeywords: string[] = [];
  let errorMessage = null;

  if (query) {
    try {
      const [mainRes, autoRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=news&page=1`, {
          next: { revalidate: 300 },
        }),
        fetch(`${API_BASE_URL}/autocomplete?q=${encodeURIComponent(query)}&max_results=10`, {
          next: { revalidate: 600 },
        }),
      ]);

      if (mainRes.status === "fulfilled" && mainRes.value.ok) {
        mainData = await mainRes.value.json();
      } else {
        errorMessage = "Failed to load news results.";
      }

      if (autoRes.status === "fulfilled" && autoRes.value.ok) {
        const autoData = await autoRes.value.json();
        relatedKeywords = autoData.suggestions || [];
      }
      
    } catch (err) {
      errorMessage = "Server request failed.";
    }
  }

  return (
    <NewsPageWrapper
      data={mainData}
      relatedKeywords={relatedKeywords}
      errorMessage={errorMessage}
      query={query}
    />
  );
}