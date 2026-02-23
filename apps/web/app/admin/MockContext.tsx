"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getMockEnabled, setMockEnabled as persistMockEnabled } from "@/lib/admin";

type MockContextValue = {
  mockEnabled: boolean;
  setMockEnabled: (enabled: boolean) => void;
};

const MockContext = createContext<MockContextValue | null>(null);

export function AdminMockProvider({ children }: { children: React.ReactNode }) {
  const [mockEnabled, setMockState] = useState(() =>
    typeof window !== "undefined" ? getMockEnabled() : false
  );

  useEffect(() => {
    setMockState(getMockEnabled());
  }, []);

  const setMockEnabled = (enabled: boolean) => {
    persistMockEnabled(enabled);
    setMockState(enabled);
  };

  return (
    <MockContext.Provider value={{ mockEnabled, setMockEnabled }}>
      {children}
    </MockContext.Provider>
  );
}

export function useAdminMock(): MockContextValue {
  const ctx = useContext(MockContext);
  if (!ctx) return { mockEnabled: false, setMockEnabled: () => {} };
  return ctx;
}

export function MockToggle() {
  const { mockEnabled, setMockEnabled } = useAdminMock();
  return (
    <button
      type="button"
      onClick={() => setMockEnabled(!mockEnabled)}
      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
        mockEnabled
          ? "border border-amber-500/40 bg-amber-500/15 text-amber-400"
          : "admin-btn-ghost text-slate-500"
      }`}
      title={mockEnabled ? "Dashboard shows mock data" : "Switch to mock data"}
    >
      Mock {mockEnabled ? "on" : "off"}
    </button>
  );
}
