"use client";
import { create } from "zustand";

interface AvatarState {
  myAvatar: string | null;
  version: number;
  setMyAvatar: (avatar: string | null) => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  myAvatar: null,
  version: 0,
  setMyAvatar: (myAvatar) => set((state) => ({ myAvatar, version: state.version + 1 })),
}));
