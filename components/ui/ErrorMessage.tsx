import { AlertCircle } from "lucide-react";
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-[10px] px-4 py-3 text-sm">
      <AlertCircle size={16} className="flex-shrink-0" />
      {message}
    </div>
  );
}
