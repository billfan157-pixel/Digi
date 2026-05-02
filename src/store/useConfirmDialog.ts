import { create } from 'zustand';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

interface ConfirmDialogState {
  open: boolean;
  options: ConfirmDialogOptions;
  resolve: ((value: boolean) => void) | null;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  open: false,
  options: { title: '', message: '' },
  resolve: null,
  confirm: () => {
    const { resolve } = get();
    resolve?.(true);
    set({ open: false, resolve: null });
  },
  cancel: () => {
    const { resolve } = get();
    resolve?.(false);
    set({ open: false, resolve: null });
  },
}));

/**
 * Show a native-feeling in-app confirmation dialog.
 *
 * Usage:
 * ```ts
 * const ok = await confirmDialog({ title: '...', message: '...' });
 * if (ok) { ... }
 * ```
 */
export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    useConfirmDialogStore.setState({
      open: true,
      options,
      resolve,
    });
  });
}
