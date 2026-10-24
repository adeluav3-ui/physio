"use client";
import { type ReactNode } from "react";
import { cn } from "./utils";

export interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center gap-3 py-12 text-center", className)}>
            {icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-text-muted">
                    {icon}
                </div>
            )}
            <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-text">{title}</p>
                {description && <p className="max-w-xs text-sm text-text-muted">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
