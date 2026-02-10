export interface TextSearchResultItem {
  title: string;
  href: string;
  body: string;
}

export interface APIResponse {
  search_type: string;
  query: string;
  count: number;
  results: TextSearchResultItem[];
}