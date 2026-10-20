"use client";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "leading" | "trailing";
    asChild?: boolean;
};

const variantStyles: Record<Variant, string> = {
    primary:
        "bg-primary-500 text-text-inverse hover:bg-primary-600 disabled:bg-neutral-200 disabled:text-neutral-500",
    secondary:
        "bg-surface text-text border border-border hover:bg-neutral-50 disabled:opacity-50",
    ghost:
        "bg-transparent text-text-muted hover:bg-neutral-100 disabled:opacity-50",
    danger:
        "bg-danger-500 text-text-inverse hover:bg-danger-700 disabled:bg-neutral-200",
};

const sizeStyles: Record<Size, string> = {
    sm: "h-10 px-3 text-sm gap-2",
    md: "h-12 px-4 text-base gap-2",
    lg: "h-14 px-6 text-lg gap-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = "primary",
        size = "md",
        loading,
        fullWidth,
        icon,
        iconPosition = "leading",
        asChild,
        className,
        disabled,
        children,
        ...rest
    },
    ref,
) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            ref={ref as never}
            disabled={disabled || loading}
            className={cn(
                "inline-flex items-center justify-center font-medium rounded-md",
                "transition-colors duration-200 ease-out",
                "disabled:cursor-not-allowed",
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && "w-full",
                className,
            )}
            {...rest}
        >
            {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
                icon && iconPosition === "leading" && <span aria-hidden>{icon}</span>
            )}
            {children}
            {!loading && icon && iconPosition === "trailing" && <span aria-hidden>{icon}</span>}
        </Comp>
    );
});