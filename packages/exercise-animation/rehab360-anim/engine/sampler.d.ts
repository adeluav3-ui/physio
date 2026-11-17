import type { SolvedPose } from "./skeleton.js";

export interface AnimExercise {
    sample(t: number): { pose: unknown; pins: unknown; phase: string; t: number };
    duration: number;
    defaultView: "front" | "side" | "angled";
    sides: "bilateral" | "unilateral";
    side: "left" | "right";
    views: Record<string, { az: number; el: number }>;
    focus: unknown[];
    props: unknown[];
    fit?: string[];
    margin?: number;
    zoom: number;
    readout?: unknown;
    counter: { mode: "reps" | "dose"; target: number; unit?: string };
    repStarts: number[];
    tempo: Array<{ phase?: string; seconds: number }>;
}

/** Returns null when no pose data exists for this id. */
export function buildExercise(poses: unknown, id: string, side: string): AnimExercise | null;
