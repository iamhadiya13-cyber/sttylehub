"use client";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { getConfirmModalProps, useConfirmModalStore } from "@/stores/confirm-modal-store";

export default function ConfirmModalHost() {
  const state = useConfirmModalStore();
  return <ConfirmModal {...getConfirmModalProps(state)} />;
}
