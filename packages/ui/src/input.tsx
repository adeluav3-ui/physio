import { forwardRef, type InputHTMLAttributes } from "react";
import * as Label from "@radix-ui/react-label";
import { cn } from "./utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
    error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, hint, error, id, className, ...rest },
    ref,
) {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
        <div className="flex flex-col gap-1">
            <Label.Root htmlFor={inputId} className="text-sm font-medium text-text">
                {label}
            </Label.Root>
            <input
                ref={ref}
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                className={cn(
                    "h-12 rounded-md border bg-surface px-3 text-base text-text",
                    "placeholder:text-text-muted",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                    error ? "border-danger-500" : "border-border",
                    className,
                )}
                {...rest}
            />
            {error ? (
                <p id={`${inputId}-error`} className="text-sm text-danger-700">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${inputId}-hint`} className="text-sm text-text-muted">
                    {hint}
                </p>
            ) : null}
        </div>
    );
});