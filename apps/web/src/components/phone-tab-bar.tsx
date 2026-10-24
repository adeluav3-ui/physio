"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { cn } from "./utils";

export interface PhoneTabItem {
    href: string;
    label: string;
    icon: ReactNode;
    /** Optional exact match — default is startsWith */
    exact?: boolean;
}

export interface PhoneTabBarProps {
    items: PhoneTabItem[];
    className?: string;
}

export function PhoneTabBar({ items, className }: PhoneTabBarProps) {
    const pathname = usePathname();
    return (
        <nav
            aria-label="Main navigation"
            className={cn(
                "fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface",
                "safe-area-inset-bottom",
                className,
            )}
        >
            {items.map((item) => {
                const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                            "min-h-[56px] justify-center",
                            active ? "text-primary-600" : "text-text-muted",
                        )}
                    >
                        <span aria-hidden className={cn("h-5 w-5", active && "text-primary-500")}>
                            {item.icon}
                        </span>
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
