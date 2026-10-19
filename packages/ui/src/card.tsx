import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

type Padding = "none" | "sm" | "md" | "lg";
const paddingMap: Record<Padding, string> = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
};

export type CardProps = HTMLAttributes<HTMLDivElement> & {
    padding?: Padding;
    interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
    { padding = "md", interactive, className, ...rest },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                "bg-surface rounded-md shadow-sm border border-border",
                paddingMap[padding],
                interactive && "transition-shadow hover:shadow-md cursor-pointer",
                className,
            )}
            {...rest}
        />
    );
});