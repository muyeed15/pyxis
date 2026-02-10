import type { Metadata } from "next";
import type { APIResponse } from "./types";
import TextResultsList from "./text";
import SearchTabs from "../../components/searchtabs";   
import SearchHeader from "../../components/searchheader"; 
import Pagination from "../../components/pagination";

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

  const flaskEndpoint = 'http://127.0.0.1:5000/search';
  let data: APIResponse | null = null;
  let errorMessage = null;

  if (query && typeof query === 'string') {
      const apiUrl = `${flaskEndpoint}?q=${encodeURIComponent(query)}&type=text&max_results=10`;
      try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        data = await res.json();
      } catch (error: any) {
        errorMessage = error.message;
      }
  }

  return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        
        <SearchHeader />

        <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-2">
                <SearchTabs customPadding="px-0" />
            </div>
        </div>

        <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 flex gap-10">
            <div className="flex-1 max-w-[650px]">
                {errorMessage ? (
                    <div className="text-red-500">Error: {errorMessage}</div>
                ) : (
                    <>
                      <TextResultsList results={data?.results || []} />
                      
                      {data?.results && data.results.length > 0 && (
                        <div className="mt-4 border-t border-gray-100 dark:border-gray-800">
                          <Pagination />
                        </div>
                      )}
                    </>
                )}
            </div>

            <div className="hidden lg:block w-[350px] shrink-0">
            </div>
        </main>
      </div>
  );
}