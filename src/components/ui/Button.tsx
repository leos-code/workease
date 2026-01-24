import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--accent-primary)] text-white hover:opacity-90",
    secondary: "bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-interactive)]",
    outline: "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
    ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
    destructive: "bg-[var(--error)] text-white hover:opacity-90",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  };
  
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {Icon && iconPosition === "left" && <Icon size={iconSizes[size]} />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={iconSizes[size]} />}
    </button>
  );
}
