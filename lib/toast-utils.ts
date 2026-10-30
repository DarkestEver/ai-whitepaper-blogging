import { toast } from "sonner";

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),

  siteCreated: (siteName: string) =>
    toast.success(`Site '${siteName}' registered successfully`),
  siteSaved: () => toast.success("Site settings saved"),
  siteDeleted: () => toast.success("Site deleted"),

  deleteFailed: (error?: string) =>
    toast.error(`Failed to delete site${error ? `: ${error}` : ""}`),
  saveFailed: (error?: string) =>
    toast.error(`Failed to save settings${error ? `: ${error}` : ""}`),

  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
};
