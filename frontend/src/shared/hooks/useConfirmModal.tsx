"use client";

import { useCallback, useRef, useState } from "react";
import ConfirmModal from "@/shared/components/common/modal/ConfirmModal";
import type { ConfirmModalProps } from "@/shared/components/common/modal/ConfirmModal";

export type ConfirmDialogOptions = Pick<
  ConfirmModalProps,
  | "title"
  | "message"
  | "confirmLabel"
  | "cancelLabel"
  | "variant"
  | "actionsLayout"
>;

export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: "",
    message: "",
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    setIsOpen(false);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const ask = useCallback((dialogOptions: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(dialogOptions);
      setIsOpen(true);
    });
  }, []);

  const modal = (
    <ConfirmModal
      isOpen={isOpen}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      actionsLayout={options.actionsLayout}
      onConfirm={() => close(true)}
      onClose={() => close(false)}
    />
  );

  return { ask, modal };
}
