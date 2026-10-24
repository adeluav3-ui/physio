"use client";
import { type HTMLAttributes } from "react";
import { cn } from "./utils";

export type ChipVariant = "default" | "accent" | "warn" | "danger" | "ok";

const variantStyles: Record<ChipVariant, string> = {
    default: "bg-neutral-100 text-neutral-700",
    accent:  "bg-primary-50 text-primary-700",
    warn:    "bg-[#fdf1d8] text-[#7a4f00]",
    danger:  "bg-[#fde8e8] text-[#8f1d1d]",
    ok:      "bg-[#e3f4e8] text-[#1d5c34]",
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: ChipVariant;
}

export function Chip({ variant = "default", className, children, ...rest }: ChipProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                variantStyles[variant],
                className,
            )}
            {...rest}
        >
            {children}
        </span>
    );
}
