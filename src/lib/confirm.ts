export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
};

type Resolver = (confirmed: boolean) => void;

class ConfirmManager {
  private listener: ((opts: ConfirmOptions, resolve: Resolver) => void) | null = null;

  register(listener: (opts: ConfirmOptions, resolve: Resolver) => void) {
    this.listener = listener;
  }

  unregister() {
    this.listener = null;
  }

  confirm(opts: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.listener) {
        this.listener(opts, resolve);
      } else {
        // Fallback just in case
        resolve(window.confirm(opts.message));
      }
    });
  }
}

export const confirmManager = new ConfirmManager();