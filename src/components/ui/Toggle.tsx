import { cn } from "../../lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-[var(--success)]" : "bg-[var(--bg-interactive)]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full transition-transform",
          checked 
            ? "translate-x-[22px] bg-white" 
            : "translate-x-[2px] bg-[var(--text-disabled)]"
        )}
      />
    </button>
  );
}
