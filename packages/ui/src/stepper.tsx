"use client";

import { cn } from "./utils";

type Step = { id: string; label: string; optional?: boolean };

export function Stepper({
    steps,
    currentStepId,
    completedStepIds,
    onStepClick,
}: {
    steps: Step[];
    currentStepId: string;
    completedStepIds: string[];
    onStepClick?: (id: string) => void;
}) {
    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
        <div className="flex flex-col gap-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                    className="h-full bg-primary-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between text-sm text-text-muted">
                <span>
                    Step {currentIndex + 1} of {steps.length}
                </span>
                <span className="font-medium text-text">{steps[currentIndex]?.label}</span>
            </div>
        </div>
    );
}