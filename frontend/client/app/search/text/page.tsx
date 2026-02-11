import type { Metadata } from "next";
import type { APIResponse } from "./types";
import PageWrapper from "./pagewrapper";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface InstantAnswerData {
  answer: string;
  image_url: string | null;
}

interface AutocompleteData {
  suggestions: string[];
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const query = searchParams.q;
  return { title: typeof query === 'string' ? `${query} - Pyxis Search` : 'Pyxis Search' };
}

export default async function TextSearchPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q;

  let data: APIResponse | null = null;
  let instantAnswer: InstantAnswerData | null = null;
  let relatedKeywords: string[] = [];
  let errorMessage = null;

  if (query && typeof query === 'string') {

    const apiUrl = `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/search?q=${encodeURIComponent(query)}&type=text&max_results=30`;
    try {
      const res = await fetch(apiUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      data = await res.json();
    } catch (error: any) {
      errorMessage = error.message;
    }


    try {
      const instantRes = await fetch(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/instant?q=${encodeURIComponent(query)}`,
        { cache: 'no-store' }
      );
      if (instantRes.ok) {
        const instantData = await instantRes.json();
        if (instantData.answer) {
          instantAnswer = {
            answer: instantData.answer,
            image_url: instantData.image_url
          };
        }
      }
    } catch (error) {

      console.log('Instant answer not available');
    }


    try {
      const autocompleteRes = await fetch(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_API}/autocomplete?q=${encodeURIComponent(query)}&max_results=8`,
        { cache: 'no-store' }
      );
      if (autocompleteRes.ok) {
        const autocompleteData: AutocompleteData = await autocompleteRes.json();
        relatedKeywords = autocompleteData.suggestions || [];
      }
    } catch (error) {

      console.log('Autocomplete not available');
    }
  }

  return (
    <PageWrapper
      data={data}
      instantAnswer={instantAnswer}
      relatedKeywords={relatedKeywords}
      errorMessage={errorMessage}
      query={query as string}
    />
  );
}