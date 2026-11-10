import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

const STORAGE_KEY = "crm-sidebar-expanded";

function readInitialExpanded() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persist(expanded: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, expanded ? "1" : "0");
  } catch {
    /* ignore */
  }
}

interface MobileSidebarState {
  /** سایدبار باز است (در موبایل به صورت drawer، در دسکتاپ به صورت ریل باز) */
  isOpen: boolean;
  /** در دسکتاپ: ریل باریک (false) یا سایدبار باز با متن (true) */
  expanded: boolean;
  /** مودال بزرگ آیکون‌ها */
  isLauncherOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setExpanded: (value: boolean) => void;
  toggleExpanded: () => void;
  openLauncher: () => void;
  closeLauncher: () => void;
  toggleLauncher: () => void;
}

export const useMobileSidebarStore = create<MobileSidebarState>((set, get) => ({
  isOpen: false,
  expanded: readInitialExpanded(),
  isLauncherOpen: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  setExpanded: (value) => {
    persist(value);
    set({ expanded: value });
  },
  toggleExpanded: () => {
    const next = !get().expanded;
    persist(next);
    set({ expanded: next });
  },

  openLauncher: () => set({ isLauncherOpen: true }),
  closeLauncher: () => set({ isLauncherOpen: false }),
  toggleLauncher: () => set((s) => ({ isLauncherOpen: !s.isLauncherOpen })),
}));

export const useSidebarIsOpen = () => useMobileSidebarStore((s) => s.isOpen);

export const useSidebarExpanded = () => useMobileSidebarStore((s) => s.expanded);

export const useSidebarLauncher = () => useMobileSidebarStore((s) => s.isLauncherOpen);

export const useSidebarActions = () =>
  useMobileSidebarStore(
    useShallow((s) => ({
      open: s.open,
      close: s.close,
      toggle: s.toggle,
      setExpanded: s.setExpanded,
      toggleExpanded: s.toggleExpanded,
      openLauncher: s.openLauncher,
      closeLauncher: s.closeLauncher,
      toggleLauncher: s.toggleLauncher,
    })),
  );
