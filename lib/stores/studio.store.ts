'use client';

import { create } from 'zustand';

type StudioState = {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));
