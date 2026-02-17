"use client";

import { SWRConfig } from "swr";
import { useState } from "react";


const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [provider] = useState(() => new Map());

  return (
    <SWRConfig
      value={{
        provider: () => provider,
        fetcher, 
        revalidateOnFocus: false, 
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
        dedupingInterval: 300000, 
        revalidateOnMount: false, 
        keepPreviousData: true,
        focusThrottleInterval: 300000,
      }}
    >
      {children}
    </SWRConfig>
  );
}