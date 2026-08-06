import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface MobileSidebarState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useMobileSidebarStore = create<MobileSidebarState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

export const useSidebarIsOpen = () => useMobileSidebarStore((s) => s.isOpen);

export const useSidebarActions = () =>
  useMobileSidebarStore(
    useShallow((s) => ({
      open: s.open,
      close: s.close,
      toggle: s.toggle,
    })),
  );
