export interface TextSearchResultItem {
  title: string;
  href: string;
  body: string;
}

export interface ImageSearchResultItem {
  title: string;
  image: string;
  thumbnail: string;
  url: string;
  height: number;
  width: number;
  source: string;
}

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
  page?: number;
  has_more?: boolean;
  results: TextSearchResultItem[] | ImageSearchResultItem[] | VideoSearchResultItem[];
}