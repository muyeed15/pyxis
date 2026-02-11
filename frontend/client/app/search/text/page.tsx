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

  const flaskEndpoint = 'http://127.0.0.1:5000';
  let data: APIResponse | null = null;
  let instantAnswer: InstantAnswerData | null = null;
  let relatedKeywords: string[] = [];
  let errorMessage = null;

  if (query && typeof query === 'string') {
      // Fetch main search results
      const apiUrl = `${flaskEndpoint}/search?q=${encodeURIComponent(query)}&type=text&max_results=10`;
      try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        data = await res.json();
      } catch (error: any) {
        errorMessage = error.message;
      }

      // Fetch instant answer (always try, but only show if available)
      try {
        const instantRes = await fetch(
          `${flaskEndpoint}/instant?q=${encodeURIComponent(query)}`,
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
        // Silently fail - instant answer is optional
        console.log('Instant answer not available');
      }

      // Fetch autocomplete keywords (always show)
      try {
        const autocompleteRes = await fetch(
          `${flaskEndpoint}/autocomplete?q=${encodeURIComponent(query)}&max_results=8`,
          { cache: 'no-store' }
        );
        if (autocompleteRes.ok) {
          const autocompleteData: AutocompleteData = await autocompleteRes.json();
          relatedKeywords = autocompleteData.suggestions || [];
        }
      } catch (error) {
        // Silently fail - will show empty state
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