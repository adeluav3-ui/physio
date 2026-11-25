import { cn } from "./utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneMap: Record<Tone, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-700",
    danger: "bg-danger-50 text-danger-700",
    info: "bg-primary-50 text-primary-700",
};

export function StatusBadge({
    status,
    tone = "neutral",
}: {
    status: string;
    tone?: Tone;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide",
                toneMap[tone],
            )}
        >
            {status.replace(/_/g, " ")}
        </span>
    );
}

export const statusToneMap: Record<string, Tone> = {
    CONFIRMED: "success",
    COMPLETED: "success",
    HELD: "success",
    RELEASED: "success",
    VERIFIED: "success",
    GREEN: "success",
    PENDING_PAYMENT: "warning",
    PENDING: "warning",
    REQUESTED: "warning",
    MATCHING: "warning",
    FLAG: "warning",
    CANCELLED: "danger",
    NO_SHOW: "danger",
    FAILED: "danger",
    REJECTED: "danger",
    IN_PERSON_REQUIRED: "danger",
    IN_PROGRESS: "info",
    EN_ROUTE: "info",
    SCHEDULED: "info",
    REFUNDED: "neutral",
    EXPIRED: "neutral",
};