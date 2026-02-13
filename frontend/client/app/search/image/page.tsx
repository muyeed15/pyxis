import type { Metadata } from "next";
import PageWrapper from "./pagewrapper";
import type { APIResponse, AutocompleteData } from "../../types";

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

export default async function ImageSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";
  const tagsParam = (searchParams.tags as string) || "";
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

  let data: APIResponse | null = null;
  let relatedKeywords: string[] = [];
  let errorMessage: string | null = null;

  const combinedSearchQuery = [query, ...tags].join(" ").trim();

  if (combinedSearchQuery) {
    const encodedQuery = encodeURIComponent(combinedSearchQuery);
    const imagesUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/search?q=${encodedQuery}&type=images&max_results=100`;
    const autocompleteUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/autocomplete?q=${encodedQuery}`;
    
    try {
      const [imagesRes, autocompleteRes] = await Promise.all([
        fetch(imagesUrl, { next: { revalidate: 300 } }),
        fetch(autocompleteUrl, { next: { revalidate: 3600 } })
      ]);

      if (!imagesRes.ok) throw new Error(`Image API Status: ${imagesRes.status}`);
      data = await imagesRes.json();

      if (autocompleteRes.ok) {
        const autocompleteData: AutocompleteData = await autocompleteRes.json();
        relatedKeywords = autocompleteData.suggestions || [];
      }

    } catch (error: any) {
      console.error("Image Search Page Error:", error);
      errorMessage = error.message || "Failed to load images.";
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