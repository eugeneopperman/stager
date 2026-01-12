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

export function SidebarProvider({ children }: SidebarProviderProps) {
  // Initialize state from localStorage (client-side only)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAutoHide, setIsAutoHide] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Timeout ref for delayed hide
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const storedCollapsed = localStorage.getItem(STORAGE_KEY_COLLAPSED);
    const storedAutoHide = localStorage.getItem(STORAGE_KEY_AUTOHIDE);

    if (storedCollapsed !== null) {
      setIsCollapsed(storedCollapsed === "true");
    }
    if (storedAutoHide !== null) {
      setIsAutoHide(storedAutoHide === "true");
    }
  }, []);

  // Persist collapsed state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(isCollapsed));
    }
  }, [isCollapsed, mounted]);

  // Persist auto-hide state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY_AUTOHIDE, String(isAutoHide));
    }
  }, [isAutoHide, mounted]);

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
