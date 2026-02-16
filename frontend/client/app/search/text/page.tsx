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

export default async function TextSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q;

  // Don't fetch on server - let client handle everything via SWR cache
  return (
    <PageWrapper
      data={null}
      instantAnswer={null}
      relatedKeywords={[]}
      errorMessage={null}
      query={query as string}
    />
  );
}