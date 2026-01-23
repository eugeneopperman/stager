"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
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

// Helper to read from localStorage
function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY_COLLAPSED) === "true";
}

function getStoredAutoHide(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY_AUTOHIDE) === "true";
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  // Read initial values from localStorage via useSyncExternalStore
  const storedCollapsed = useSyncExternalStore(
    subscribeToStorage,
    getStoredCollapsed,
    () => false
  );
  const storedAutoHide = useSyncExternalStore(
    subscribeToStorage,
    getStoredAutoHide,
    () => false
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Initialize state from localStorage (client-side only)
  const [isCollapsed, setIsCollapsed] = useState(storedCollapsed);
  const [isAutoHide, setIsAutoHide] = useState(storedAutoHide);
  const [isHovered, setIsHovered] = useState(false);

  // Timeout ref for delayed hide
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when stored values change
  useEffect(() => {
    if (mounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing state with external store is valid
      setIsCollapsed(storedCollapsed);
    }
  }, [storedCollapsed, mounted]);

  useEffect(() => {
    if (mounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing state with external store is valid
      setIsAutoHide(storedAutoHide);
    }
  }, [storedAutoHide, mounted]);

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
