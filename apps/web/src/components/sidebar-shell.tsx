"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { cn } from "@physio/ui";

export interface SidebarNavItem {
    href: string;
    label: string;
    icon?: ReactNode;
    exact?: boolean;
}

export interface SidebarShellProps {
    navItems: SidebarNavItem[];
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function SidebarShell({ navItems, header, footer, children, className }: SidebarShellProps) {
    const pathname = usePathname();
    return (
        <div className={cn("flex min-h-screen bg-bg", className)}>
            {/* Desktop sidebar */}
            <aside className="hidden w-64 flex-col border-r border-border bg-surface lg:flex">
                {header && (
                    <div className="flex items-center border-b border-border px-4 py-3">
                        {header}
                    </div>
                )}
                <nav className="flex-1 overflow-y-auto p-2" aria-label="Sidebar navigation">
                    <ul className="flex flex-col gap-0.5">
                        {navItems.map((item) => {
                            const active = item.exact
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            active
                                                ? "bg-primary-50 text-primary-700"
                                                : "text-text-muted hover:bg-neutral-100 hover:text-text",
                                        )}
                                    >
                                        {item.icon && (
                                            <span aria-hidden className="h-4 w-4 flex-shrink-0">
                                                {item.icon}
                                            </span>
                                        )}
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                {footer && (
                    <div className="border-t border-border p-4">{footer}</div>
                )}
            </aside>
            {/* Main */}
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}
