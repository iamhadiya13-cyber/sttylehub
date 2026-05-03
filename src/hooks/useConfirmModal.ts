"use client";

import { useMemo } from "react";
import { getConfirmModalProps, useConfirmModalStore, type ConfirmOptions } from "@/stores/confirm-modal-store";

export function useConfirmModal(): {
  isOpen: boolean;
  modalProps: ReturnType<typeof getConfirmModalProps>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
} {
  const state = useConfirmModalStore();

  return useMemo(
    () => ({
      isOpen: state.isOpen,
      modalProps: getConfirmModalProps(state),
      confirm: state.confirm,
    }),
    [state],
  );
}

export default useConfirmModal;
