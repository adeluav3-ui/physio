"use client";

import { Button } from "./button";
import { Card } from "./card";

export function ExerciseCard({
    exercise,
    prescription,
    completedToday,
    onDone,
    onOpenDetail,
}: {
    exercise: { id: string; name: string; posterUrl: string; cues: string };
    prescription: { sets: number; reps: number; holdSeconds: number; frequency: string };
    completedToday: boolean;
    onDone: () => void;
    onOpenDetail: () => void;
}) {
    return (
        <Card padding="none" className="overflow-hidden">
            <button
                type="button"
                onClick={onOpenDetail}
                className="relative block aspect-video w-full bg-neutral-100"
                aria-label={`Open ${exercise.name} details`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={exercise.posterUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-3xl text-white">
                    ▶
                </span>
            </button>
            <div className="flex flex-col gap-3 p-4">
                <div>
                    <h3 className="text-lg font-semibold text-text">{exercise.name}</h3>
                    <p className="mt-1 text-sm text-text-muted">
                        {prescription.sets} × {prescription.reps}
                        {prescription.holdSeconds > 0 && `, hold ${prescription.holdSeconds}s`} · {prescription.frequency}
                    </p>
                </div>
                <p className="line-clamp-2 text-sm text-text-muted">{exercise.cues}</p>
                <Button onClick={onDone} fullWidth disabled={completedToday}>
                    {completedToday ? "✓ Done today" : "Done"}
                </Button>
            </div>
        </Card>
    );
}