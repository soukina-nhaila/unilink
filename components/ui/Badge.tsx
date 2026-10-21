import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "ghost";
  className?: string;
}

const variants = {
  primary: "bg-primary-50 text-primary-800",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
  ghost: "bg-surface-3 text-text-2",
};

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  return (
    <span className={cn("badge", variants[variant], className)}>
      {children}
    </span>
  );
}
