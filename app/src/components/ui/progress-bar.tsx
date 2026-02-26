import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped > 85
      ? "bg-red-500"
      : clamped > 60
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className={cn("h-2 w-full rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
