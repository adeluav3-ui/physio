"use client";
import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "./utils";

export interface TabItem {
    key: string;
    label: string;
    icon?: ReactNode;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
    items: TabItem[];
    active: string;
    onChange: (key: string) => void;
}

export function Tabs({ items, active, onChange, className, ...rest }: TabsProps) {
    return (
        <div
            role="tablist"
            className={cn("flex border-b border-border", className)}
            {...rest}
        >
            {items.map((item) => {
                const isActive = item.key === active;
                return (
                    <button
                        key={item.key}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(item.key)}
                        className={cn(
                            "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                            isActive
                                ? "border-primary-500 text-primary-600"
                                : "border-transparent text-text-muted hover:text-text",
                        )}
                    >
                        {item.icon && <span aria-hidden>{item.icon}</span>}
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
