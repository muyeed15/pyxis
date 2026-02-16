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

export default async function ImageSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";
  const tagsParam = (searchParams.tags as string) || "";
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

  // Don't fetch on server - let client handle everything via SWR cache
  return (
    <PageWrapper 
      data={null} 
      relatedKeywords={[]} 
      errorMessage={null} 
      query={query}
      tags={tags}
    />
  );
}