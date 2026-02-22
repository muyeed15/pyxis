import type { Metadata } from "next";
import PageWrapper from "./pagewrapper";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";
  return {
    title: query ? `${query} - Pyxis Videos` : "Pyxis Videos",
  };
}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default async function VideoSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = (searchParams.q as string) || "";

  let data = null;
  let errorMessage = null;

  if (query) {
    const res = await fetch(
      `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=videos&max_results=20&page=1`,
      { next: { revalidate: 600 } },
    );

    if (res.ok) {
      data = await res.json();
    } else {
      errorMessage = "Failed to load video results.";
    }
  }

  return <PageWrapper data={data} errorMessage={errorMessage} query={query} />;
}
