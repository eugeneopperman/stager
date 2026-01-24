"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "./NotificationDropdown";
import {
  useGlobalSearch,
  SearchBar,
  SearchResults,
} from "./floating-controls";

export function FloatingControls() {
  const router = useRouter();
  const {
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
  } = useGlobalSearch();

  const handleResultClick = useCallback(
    (url: string) => {
      closeSearch();
      router.push(url);
    },
    [closeSearch, router]
  );

  return (
    <nav className="fixed top-3 right-3 sm:top-4 sm:right-6 z-50 flex items-center gap-2" aria-label="Quick actions">
      {/* Search */}
      <div ref={searchRef} className="relative">
        <SearchBar
          isOpen={isSearchOpen}
          query={searchQuery}
          isSearching={isSearching}
          inputRef={inputRef}
          onOpen={openSearch}
          onClose={closeSearch}
          onChange={handleSearchChange}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
        />

        {isSearchOpen && showResults && searchQuery.length >= 2 && (
          <SearchResults
            isSearching={isSearching}
            searchQuery={searchQuery}
            results={searchResults}
            hasResults={hasResults}
            onResultClick={handleResultClick}
          />
        )}
      </div>

      {/* Notifications */}
      <NotificationDropdown />
    </nav>
  );
}
