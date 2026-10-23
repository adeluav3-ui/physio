import { Button } from "./button";
import { Card } from "./card";
import type { TriageLevel } from "@physio/shared";

const config: Record<
    TriageLevel,
    { title: string; icon: string; tone: string; border: string }
> = {
    GREEN: {
        title: "You're suitable for online care",
        icon: "✓",
        tone: "text-success-700",
        border: "border-success-500",
    },
    AMBER: {
        title: "Start online — a home visit may be needed",
        icon: "!",
        tone: "text-warning-700",
        border: "border-warning-500",
    },
    RED: {
        title: "You need urgent in-person care",
        icon: "⚠",
        tone: "text-danger-700",
        border: "border-danger-500",
    },
};

export function TriageResultCard({
    level,
    reasons,
    primaryAction,
    secondaryAction,
    emergencyContacts,
}: {
    level: TriageLevel;
    reasons: string[];
    primaryAction?: { label: string; onClick: () => void };
    secondaryAction?: { label: string; onClick: () => void };
    emergencyContacts?: { label: string; phone: string }[];
}) {
    const c = config[level]!;
    return (
        <div className="flex min-h-[70vh] items-center justify-center p-4">
            <Card className={`w-full max-w-xl border-t-4 ${c.border} p-8`}>
                <div className={`mb-4 text-4xl ${c.tone}`} aria-hidden>
                    {c.icon}
                </div>
                <h1 className="text-2xl font-semibold text-text">{c.title}</h1>
                <ul className="mt-4 flex flex-col gap-2 text-base text-text-muted">
                    {reasons.map((r, i) => (
                        <li key={i} className="flex gap-2">
                            <span aria-hidden>•</span>
                            <span>{r}</span>
                        </li>
                    ))}
                </ul>

                {level === "RED" && emergencyContacts && (
                    <div className="mt-6 rounded-md bg-danger-50 p-4">
                        <p className="mb-2 text-sm font-semibold text-danger-700">
                            Call emergency services now
                        </p>
                        <ul className="flex flex-col gap-1 text-base">
                            {emergencyContacts.map((e) => (
                                <li key={e.phone}>
                                    <a className="font-medium text-danger-700 underline" href={`tel:${e.phone}`}>
                                        {e.label}: {e.phone}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-3">
                    {primaryAction && level !== "RED" && (
                        <Button onClick={primaryAction.onClick} fullWidth>
                            {primaryAction.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button variant="ghost" onClick={secondaryAction.onClick} fullWidth>
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}