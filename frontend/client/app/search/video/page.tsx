import type { Metadata } from "next";
import PageWrapper from "./pagewrapper";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";
  return { 
    title: query ? `${query} - Pyxis Videos` : 'Pyxis Videos' 
  };
}

export default async function VideoSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";

  return (
    <PageWrapper 
      data={null} 
      errorMessage={null} 
      query={query}
    />
  );
}