import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface SidebarState {
  isLauncherOpen: boolean;
  openLauncher: () => void;
  closeLauncher: () => void;
  toggleLauncher: () => void;
}

export const useMobileSidebarStore = create<SidebarState>((set) => ({
  isLauncherOpen: false,
  openLauncher: () => set({ isLauncherOpen: true }),
  closeLauncher: () => set({ isLauncherOpen: false }),
  toggleLauncher: () => set((s) => ({ isLauncherOpen: !s.isLauncherOpen })),
}));

export const useSidebarLauncher = () => useMobileSidebarStore((s) => s.isLauncherOpen);

export const useSidebarActions = () =>
  useMobileSidebarStore(
    useShallow((s) => ({
      openLauncher: s.openLauncher,
      closeLauncher: s.closeLauncher,
      toggleLauncher: s.toggleLauncher,
    })),
  );
