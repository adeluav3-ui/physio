export interface SolvedPose {
    seg: Record<string, { p: [number, number, number]; q: [number, number, number, number] }>;
    time?: number;
}

export function solve(pose: unknown, pins: unknown): SolvedPose;
export function measure(readout: unknown, solved: SolvedPose, pose: unknown): number;
export function point(seg: SolvedPose["seg"], name: string): [number, number, number];
