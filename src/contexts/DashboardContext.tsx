"use client";

import { createContext, useContext } from "react";

interface DashboardContextValue {
  credits: number;
  user?: {
    email?: string;
    full_name?: string;
  };
}

const DashboardContext = createContext<DashboardContextValue>({
  credits: 0,
  user: undefined,
});

export function DashboardProvider({
  children,
  credits,
  user,
}: {
  children: React.ReactNode;
  credits: number;
  user?: { email?: string; full_name?: string };
}) {
  return (
    <DashboardContext.Provider value={{ credits, user }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
