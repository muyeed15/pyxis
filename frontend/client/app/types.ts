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

// video
export interface VideoSearchResultItem {
  title: string;
  content: string;   
  description?: string;
  images?: {         
    large?: string;
    medium?: string;
    small?: string;
    motion?: string;
  } | string;        
  duration?: string;
  publisher?: string;
  published?: string;
  statistics?: {
    viewCount?: number;
  };
}

export interface AutocompleteData {
  suggestions: string[];
}

export interface APIResponse {
  search_type: string;
  query: string;
  count: number;
  results: TextSearchResultItem[] | ImageSearchResultItem[] | VideoSearchResultItem[];
}