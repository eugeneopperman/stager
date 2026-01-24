"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SearchResult {
  properties: Array<{
    id: string;
    address: string;
    description: string | null;
  }>;
  stagingJobs: Array<{
    id: string;
    room_type: string;
    style: string;
    staged_image_url: string | null;
    status: string;
    created_at: string;
    property: { id: string; address: string } | null;
  }>;
}

interface UseGlobalSearchResult {
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult | null;
  isSearching: boolean;
  showResults: boolean;
  hasResults: boolean;
  searchRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  openSearch: () => void;
  closeSearch: () => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowResults: (show: boolean) => void;
}

export function useGlobalSearch(): UseGlobalSearchResult {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      setShowResults(true);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    },
    [performSearch]
  );

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    setShowResults(false);
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        if (searchQuery === "") {
          closeSearch();
        } else {
          setShowResults(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery, closeSearch]);

  // Close search on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  const hasResults =
    !!searchResults &&
    (searchResults.properties.length > 0 ||
      searchResults.stagingJobs.length > 0);

  return {
    isSearchOpen,
    searchQuery,
    searchResults,
    isSearching,
    showResults,
    hasResults,
    searchRef,
    inputRef,
    openSearch,
    closeSearch,
    handleSearchChange,
    setShowResults,
  };
}
