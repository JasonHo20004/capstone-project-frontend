import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * Fixed top banner shown whenever the browser reports it is offline. Rendered
 * once globally so any in-progress action (test answers, checkout, submit)
 * gives the user a clear "you are offline" signal instead of failing silently.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-[100] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        Mất kết nối mạng — thao tác có thể chưa được lưu. Đang chờ kết nối lại…
      </span>
    </div>
  );
}

export default OfflineBanner;
