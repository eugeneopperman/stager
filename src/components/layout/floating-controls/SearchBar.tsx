"use client";

import { memo, forwardRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  isOpen: boolean;
  query: string;
  isSearching: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onOpen: () => void;
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
}

export const SearchBar = memo(
  forwardRef<HTMLDivElement, SearchBarProps>(function SearchBar(
    {
      isOpen,
      query,
      isSearching,
      inputRef,
      onOpen,
      onClose,
      onChange,
      onFocus,
    },
    ref
  ) {
    return (
      <div ref={ref} className="relative">
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden",
            "bg-card/80 backdrop-blur-xl",
            "border border-black/[0.08] dark:border-white/[0.12]",
            "shadow-lg rounded-full",
            "transition-all duration-300 ease-out",
            isOpen ? "w-[calc(100vw-6rem)] sm:w-80 pl-4 pr-2" : "w-10"
          )}
        >
          {isOpen ? (
            <>
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                ref={inputRef}
                placeholder="Search properties, staging jobs..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0 px-0 h-10 dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent"
                value={query}
                onChange={onChange}
                onFocus={onFocus}
              />
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onOpen}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    );
  })
);
