"use client";

// Dashboard preferences shared by the header and every grid on the page: the tile size,
// remembered on this device.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type GridSize = "large" | "medium" | "small";

const SIZE_KEY = "curatit-grid-size";
const PrefsContext = createContext<{ size: GridSize; setSize: (size: GridSize) => void } | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [size, setSizeState] = useState<GridSize>("medium");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIZE_KEY);
      if (stored === "large" || stored === "medium" || stored === "small") setSizeState(stored);
    } catch {}
  }, []);

  const setSize = (next: GridSize) => {
    setSizeState(next);
    try {
      localStorage.setItem(SIZE_KEY, next);
    } catch {}
  };

  return <PrefsContext.Provider value={{ size, setSize }}>{children}</PrefsContext.Provider>;
}

export function useGridSize() {
  const value = useContext(PrefsContext);
  if (!value) throw new Error("useGridSize outside PrefsProvider");
  return value;
}
