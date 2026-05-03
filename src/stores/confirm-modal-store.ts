"use client";

import { create } from "zustand";
import type { ConfirmModalProps, ConfirmModalVariant } from "@/components/ui/ConfirmModal";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  action?: () => void | Promise<void>;
};

type ConfirmResolver = (value: boolean) => void;

type ConfirmModalState = {
  isOpen: boolean;
  loading: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmModalVariant;
  resolver: ConfirmResolver | null;
  action: (() => void | Promise<void>) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  close: () => void;
  submit: () => Promise<void>;
};

const defaultState = {
  isOpen: false,
  loading: false,
  title: "",
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default" as ConfirmModalVariant,
  resolver: null as ConfirmResolver | null,
  action: null as (() => void | Promise<void>) | null,
};

function resolveAndReset(state: ConfirmModalState, value: boolean) {
  state.resolver?.(value);
  return {
    ...defaultState,
  };
}

export const useConfirmModalStore = create<ConfirmModalState>((set, get) => ({
  ...defaultState,
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      const current = get();
      if (current.resolver) {
        current.resolver(false);
      }

      set({
        isOpen: true,
        loading: false,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? "Confirm",
        cancelText: options.cancelText ?? "Cancel",
        variant: options.variant ?? "default",
        resolver: resolve,
        action: options.action ?? null,
      });
    }),
  close: () => {
    const state = get();
    if (state.loading) {
      return;
    }

    set(resolveAndReset(state, false));
  },
  submit: async () => {
    const state = get();
    if (!state.isOpen || state.loading) {
      return;
    }

    if (!state.action) {
      set(resolveAndReset(state, true));
      return;
    }

    try {
      set({ loading: true });
      await state.action();
      const next = get();
      set(resolveAndReset(next, true));
    } catch {
      const next = get();
      set(resolveAndReset({ ...next, loading: false }, false));
    }
  },
}));

export function getConfirmModalProps(state: ConfirmModalState): ConfirmModalProps {
  return {
    isOpen: state.isOpen,
    onClose: state.close,
    onConfirm: () => {
      void state.submit();
    },
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    loading: state.loading,
  };
}
