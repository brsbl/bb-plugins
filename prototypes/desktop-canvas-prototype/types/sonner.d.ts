/** bb provides sonner at runtime (the build shims it to the host's copy); this is the part Canvas Desktop calls. */
declare module "sonner" {
  interface Toast {
    (message: string): string | number;
    success(message: string): string | number;
    error(message: string): string | number;
  }
  export const toast: Toast;
}
