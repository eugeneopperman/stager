"use client";

import { SWRConfig } from "swr";
import { fetcher, defaultConfig } from "@/lib/swr";

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        ...defaultConfig,
        fetcher,
      }}
    >
      {children}
    </SWRConfig>
  );
}
