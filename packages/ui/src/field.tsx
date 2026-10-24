"use client";
import { type HTMLAttributes, type LabelHTMLAttributes } from "react";
import { cn } from "./utils";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
    label?: string;
    htmlFor?: LabelHTMLAttributes<HTMLLabelElement>["htmlFor"];
    error?: string;
    hint?: string;
    required?: boolean;
}

export function Field({ label, htmlFor, error, hint, required, className, children, ...rest }: FieldProps) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)} {...rest}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    className="text-sm font-medium text-text"
                >
                    {label}
                    {required && <span aria-hidden className="ml-0.5 text-[#8f1d1d]">*</span>}
                </label>
            )}
            {children}
            {error && (
                <p role="alert" className="text-xs font-medium text-[#8f1d1d]">
                    {error}
                </p>
            )}
            {!error && hint && (
                <p className="text-xs text-text-muted">{hint}</p>
            )}
        </div>
    );
}
