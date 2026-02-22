import type { Metadata } from "next";
import PageWrapper from "./pagewrapper";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = searchParams.q;
  return { title: typeof query === 'string' ? `${query} - Pyxis Search` : 'Pyxis Search' };
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export default async function TextSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || '';

  let data = null;
  let instantAnswer = null;
  let relatedKeywords: string[] = [];
  let errorMessage = null;

  if (query) {
    const [searchRes, instantRes, autoRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=text&max_results=50&safesearch=on`,
            { next: { revalidate: 600 } }),
      fetch(`${API_BASE_URL}/instant?q=${encodeURIComponent(query)}`,
            { next: { revalidate: 600 } }),
      fetch(`${API_BASE_URL}/autocomplete?q=${encodeURIComponent(query)}&max_results=10`,
            { next: { revalidate: 600 } }),
    ]);

    if (searchRes.status === 'fulfilled' && searchRes.value.ok) {
      data = await searchRes.value.json();
    } else {
      errorMessage = 'Failed to load search results.';
    }

    if (instantRes.status === 'fulfilled' && instantRes.value.ok) {
      instantAnswer = await instantRes.value.json();
    }

    if (autoRes.status === 'fulfilled' && autoRes.value.ok) {
      const autoData = await autoRes.value.json();
      relatedKeywords = autoData.suggestions || [];
    }
  }

  return (
    <PageWrapper
      data={data}
      instantAnswer={instantAnswer}
      relatedKeywords={relatedKeywords}
      errorMessage={errorMessage}
      query={query}
    />
  );
}