"use client";
import { cn } from "./utils";

export interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    className?: string;
    size?: "sm" | "md";
    variant?: "accent" | "ok" | "warn" | "danger";
}

const variantFill: Record<NonNullable<ProgressBarProps["variant"]>, string> = {
    accent: "bg-primary-500",
    ok:     "bg-[#22c55e]",
    warn:   "bg-[#f59e0b]",
    danger: "bg-[#ef4444]",
};

export function ProgressBar({
    value,
    max = 100,
    label,
    showValue,
    className,
    size = "md",
    variant = "accent",
}: ProgressBarProps) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            {(label || showValue) && (
                <div className="flex items-center justify-between">
                    {label && <span className="text-sm font-medium text-text">{label}</span>}
                    {showValue && <span className="text-xs text-text-muted">{Math.round(pct)}%</span>}
                </div>
            )}
            <div
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label}
                className={cn(
                    "w-full overflow-hidden rounded-full bg-neutral-100",
                    size === "sm" ? "h-1.5" : "h-2.5",
                )}
            >
                <div
                    className={cn("h-full rounded-full transition-all duration-300 ease-out", variantFill[variant])}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
