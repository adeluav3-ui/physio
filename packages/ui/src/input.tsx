"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import * as Label from "@radix-ui/react-label";
import { cn } from "./utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
    error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, hint, error, id, className, type, ...rest },
    ref,
) {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";
    const actualType = isPassword && revealed ? "text" : type;

    return (
        <div className="flex flex-col gap-1">
            <Label.Root htmlFor={inputId} className="text-sm font-medium text-text">
                {label}
            </Label.Root>
            <div className="relative">
                <input
                    ref={ref}
                    id={inputId}
                    type={actualType}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    className={cn(
                        "h-12 w-full rounded-md border bg-surface px-3 text-base text-text",
                        "placeholder:text-text-muted",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                        error ? "border-danger-500" : "border-border",
                        isPassword && "pr-12",
                        className,
                    )}
                    {...rest}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed((v) => !v)}
                        aria-label={revealed ? "Hide password" : "Show password"}
                        aria-pressed={revealed}
                        className="absolute inset-y-0 right-0 flex h-12 w-12 items-center justify-center text-text-muted hover:text-text"
                    >
                        {revealed ? (
                            // eye-off icon
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            // eye icon
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
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