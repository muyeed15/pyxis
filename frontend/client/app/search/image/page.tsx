import type { Metadata } from "next";
import PageWrapper from "./pagewrapper";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";
  return { 
    title: query ? `${query} - Pyxis Images` : 'Pyxis Images' 
  };
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export default async function ImageSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";
  const tagsParam = (searchParams.tags as string) || "";
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

  const combinedQuery = [query, ...tags].join(' ').trim();

  let data = null;
  let relatedKeywords: string[] = [];
  let errorMessage = null;

  if (combinedQuery) {
    const [searchRes, autoRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(combinedQuery)}&type=images&max_results=50`,
            { next: { revalidate: 600 } }),
      fetch(`${API_BASE_URL}/autocomplete?q=${encodeURIComponent(combinedQuery)}&max_results=15`,
            { next: { revalidate: 600 } }),
    ]);

    if (searchRes.status === 'fulfilled' && searchRes.value.ok) {
      data = await searchRes.value.json();
    } else {
      errorMessage = 'Failed to load image results.';
    }

    if (autoRes.status === 'fulfilled' && autoRes.value.ok) {
      const autoData = await autoRes.value.json();
      relatedKeywords = autoData.suggestions || [];
    }
  }

  return (
    <PageWrapper 
      data={data}
      relatedKeywords={relatedKeywords}
      errorMessage={errorMessage}
      query={query}
      tags={tags}
    />
  );
}