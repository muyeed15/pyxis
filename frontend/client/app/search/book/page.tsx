import type {Metadata} from "next";
import PageWrapper from "./pagewrapper";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined}>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const query = searchParams.q;
    return {
        title: typeof query === "string" ? `${query} - Books - Pyxis`: "Pyxis Books",
    };

}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

export default async function BookSearchPage(props: PageProps){
    const searchParams = await props.searchParams;
    const query = (searchParams.q as string) || "";
    
    let data = null;
    let relatedKeywords: string[]= [];
    let error = null;

    if (query) {
        const [searchResponse, autocompleteResponse] = await Promise.allSettled([
            fetch(
                `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=book&page=1`,{next: {revalidate: 600}}
            ),
            fetch(
                `${API_BASE_URL}/autocomplete?q=${encodeURIComponent(query)}&max_results=10`,{next:{revalidate:600}}
            ),

        ]);
        if (searchResponse.status === "fulfilled" && searchResponse.value.ok){
            data = await searchResponse.value.json();
        } else{
            error = "Failed to load the book results.";
        }
        if (autocompleteResponse.status === "fulfilled" && autocompleteResponse.value.ok){
            const autoData = await autocompleteResponse.value.json();
            relatedKeywords = autoData.suggestions || [];
        }
    }

    return (
        <PageWrapper
            data = {data}
            relatedKeywords = {relatedKeywords}
            errorMessage={errorMessage}
            query={query}
        />
    );
}