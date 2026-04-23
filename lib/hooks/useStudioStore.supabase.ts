import { create } from "zustand";

type SettingsSnapshot = { id: string; manualClosed: boolean };

type StudioState = {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  settings: SettingsSnapshot | null;
  setSettings: (s: SettingsSnapshot | null) => void;
  setManualClosed: (v: boolean) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  settings: null,
  setSettings: (s) => set({ settings: s }),
  setManualClosed: (v) =>
    set((state) =>
      state.settings
        ? { settings: { ...state.settings, manualClosed: v } }
        : state
    ),
}));
