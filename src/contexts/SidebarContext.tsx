"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// localStorage keys
const STORAGE_KEY_COLLAPSED = "stager-sidebar-collapsed";
const STORAGE_KEY_AUTOHIDE = "stager-sidebar-autohide";

interface SidebarState {
  isCollapsed: boolean;
  isAutoHide: boolean;
  isHovered: boolean;
}

interface SidebarContextValue extends SidebarState {
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setAutoHide: (enabled: boolean) => void;
  setHovered: (hovered: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

// Safe localStorage read helper
function safeGetItem(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const value = localStorage.getItem(key);
    return value === "true";
  } catch {
    return defaultValue;
  }
}

// Safe localStorage write helper
function safeSetItem(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors (e.g., quota exceeded, private browsing)
  }
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  // Track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);

  // Initialize state with defaults (will be hydrated on mount)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAutoHide, setIsAutoHide] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Timeout ref for delayed hide
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track if we've hydrated from localStorage
  const hasHydrated = useRef(false);

  // Hydrate state from localStorage on mount (only once)
  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      setIsCollapsed(safeGetItem(STORAGE_KEY_COLLAPSED, false));
      setIsAutoHide(safeGetItem(STORAGE_KEY_AUTOHIDE, false));
    }
    setIsMounted(true);
  }, []);

  // Persist collapsed state to localStorage (skip initial render)
  const isCollapsedRef = useRef(isCollapsed);
  useEffect(() => {
    // Skip if this is the hydration update
    if (!isMounted) return;
    // Skip if value hasn't actually changed from user action
    if (isCollapsedRef.current === isCollapsed && hasHydrated.current) {
      isCollapsedRef.current = isCollapsed;
      return;
    }
    isCollapsedRef.current = isCollapsed;
    safeSetItem(STORAGE_KEY_COLLAPSED, isCollapsed);
  }, [isCollapsed, isMounted]);

  // Persist auto-hide state to localStorage
  const isAutoHideRef = useRef(isAutoHide);
  useEffect(() => {
    if (!isMounted) return;
    if (isAutoHideRef.current === isAutoHide && hasHydrated.current) {
      isAutoHideRef.current = isAutoHide;
      return;
    }
    isAutoHideRef.current = isAutoHide;
    safeSetItem(STORAGE_KEY_AUTOHIDE, isAutoHide);
  }, [isAutoHide, isMounted]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_COLLAPSED && e.newValue !== null) {
        setIsCollapsed(e.newValue === "true");
      }
      if (e.key === STORAGE_KEY_AUTOHIDE && e.newValue !== null) {
        setIsAutoHide(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const handleSetAutoHide = useCallback((enabled: boolean) => {
    setIsAutoHide(enabled);
    // Reset hover state when disabling auto-hide
    if (!enabled) {
      setIsHovered(false);
    }
  }, []);

  const handleSetHovered = useCallback((hovered: boolean) => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (hovered) {
      setIsHovered(true);
    } else {
      // Delay hiding to prevent flicker
      hideTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: [ to toggle collapsed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs/textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);

  const value: SidebarContextValue = {
    isCollapsed,
    isAutoHide,
    isHovered,
    toggleCollapsed,
    setCollapsed,
    setAutoHide: handleSetAutoHide,
    setHovered: handleSetHovered,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
