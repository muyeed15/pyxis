//text
export interface TextSearchResultItem {
  title: string;
  href: string;
  body: string;
}

//image
export interface ImageSearchResultItem {
  title: string;
  image: string;      
  thumbnail: string;  
  url: string;        
  height: number;
  width: number;
  source: string;
}

export interface AutocompleteData {
  suggestions: string[];
}

export interface APIResponse {
  search_type: string;
  query: string;
  count: number;
  results: TextSearchResultItem[] | ImageSearchResultItem[];
}