"use client";

import { createContext, useContext } from "react";

const LockScrollContext = createContext<boolean | null>(null);

export function LockScrollProvider({
  lockScroll,
  children,
}: {
  lockScroll: boolean;
  children: React.ReactNode;
}) {
  return (
    <LockScrollContext.Provider value={lockScroll}>
      {children}
    </LockScrollContext.Provider>
  );
}

export const useLockScrollContext = () => useContext(LockScrollContext);
