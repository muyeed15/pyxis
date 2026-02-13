"use client";

import { SWRConfig } from "swr";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [provider] = useState(() => new Map());

  return (
    <SWRConfig
      value={{
        provider: () => provider,
        revalidateOnFocus: false, 
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}