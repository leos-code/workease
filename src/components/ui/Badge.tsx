import { cn } from "../../lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "accent";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  size = "sm",
  children,
  className,
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-full";
  
  const variants = {
    default: "bg-[var(--bg-elevated)] text-[var(--text-disabled)]",
    success: "bg-[var(--success-tint)] text-[var(--success)]",
    warning: "bg-[#F59E0B18] text-[var(--warning)]",
    error: "bg-[#EF444418] text-[var(--error)]",
    info: "bg-[var(--info-tint)] text-[var(--info)]",
    accent: "bg-[var(--accent-tint)] text-[var(--accent-primary)]",
  };
  
  const sizes = {
    sm: "px-2.5 py-1 text-[10px]",
    md: "px-3 py-1.5 text-xs",
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
