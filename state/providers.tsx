"use client";

import * as React from "react";
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { Provider as JotaiProvider } from "jotai";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';


function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}


export function BaseProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>

      <JotaiProvider>
        {children}
        <Toaster
          position="top-right"
          className="z-[999999]"
          toastOptions={{
            style: {
              background: '#000',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: '200',
              letterSpacing: '0.02em',
              borderRadius: '12px',
            },
          }}
        />
      </JotaiProvider>
    </ThemeProvider>
  );
}


export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });

    // Only setup persistence on the client side
    if (typeof window !== 'undefined') {
      // Create a custom persister using IndexedDB via idb-keyval
      const idbPersister: Persister = {
        persistClient: async (persistedClient: PersistedClient) => {
          await set('waveflip-cache', persistedClient);
        },
        restoreClient: async () => {
          return await get('waveflip-cache');
        },
        removeClient: async () => {
          await del('waveflip-cache');
        },
      };

      // Setup query persistence
      persistQueryClient({
        queryClient: client,
        persister: idbPersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        buster: process.env.NEXT_PUBLIC_VERSION || '1.0.0', // Cache buster
      });
    }

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BaseProviders>
      <QueryProvider>{children}</QueryProvider>
    </BaseProviders>
  );
}

