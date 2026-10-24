"use client";
import { cn } from "./utils";

export interface VerifiedBadgeProps {
    className?: string;
    size?: "sm" | "md";
    label?: string;
}

export function VerifiedBadge({ className, size = "md", label = "Verified" }: VerifiedBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full bg-[#e3f4e8] font-medium text-[#1d5c34]",
                size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
                className,
            )}
            title="Licensed and verified by Rehab360"
        >
            {/* checkmark */}
            <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
            >
                <path
                    d="M2.5 6.5L4.5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            {label}
        </span>
    );
}
