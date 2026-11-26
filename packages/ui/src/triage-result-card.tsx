"use client";

import { Button } from "./button";
import { Card } from "./card";
import type { TriageLevel } from "@physio/shared";

const config: Record<
    TriageLevel,
    { title: string; subtitle?: string; icon: string; tone: string; border: string }
> = {
    GREEN: {
        title: "You're suitable for online care",
        icon: "✓",
        tone: "text-success-700",
        border: "border-success-500",
    },
    FLAG: {
        title: "Book now — your specialist will review your case",
        subtitle: "Some of your answers need a clinical review. Book your first session and your specialist will assess them with you.",
        icon: "!",
        tone: "text-warning-700",
        border: "border-warning-500",
    },
    IN_PERSON_REQUIRED: {
        title: "Your condition needs an in-person assessment",
        subtitle: "Based on your answers, an online session is not the safest first step. Our team has been notified and will follow up with you to help you find the right care.",
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
}: {
    level: TriageLevel;
    reasons: string[];
    primaryAction?: { label: string; onClick: () => void };
    secondaryAction?: { label: string; onClick: () => void };
}) {
    const c = config[level]!;
    return (
        <div className="flex min-h-[70vh] items-center justify-center p-4">
            <Card className={`w-full max-w-xl border-t-4 ${c.border} p-8`}>
                <div className={`mb-4 text-4xl ${c.tone}`} aria-hidden>
                    {c.icon}
                </div>
                <h1 className="text-2xl font-semibold text-text">{c.title}</h1>

                {/* Subtitle overrides reason list for FLAG/IN_PERSON_REQUIRED */}
                {c.subtitle ? (
                    <p className="mt-4 text-base text-text-muted">{c.subtitle}</p>
                ) : (
                    <ul className="mt-4 flex flex-col gap-2 text-base text-text-muted">
                        {reasons.map((r, i) => (
                            <li key={i} className="flex gap-2">
                                <span aria-hidden>•</span>
                                <span>{r}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-8 flex flex-col gap-3">
                    {primaryAction && level !== "IN_PERSON_REQUIRED" && (
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
