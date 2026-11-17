import type { AnimExercise } from "./sampler.js";
import type { SolvedPose } from "./skeleton.js";

export interface Colours {
    floor: string; mat: string; wall: string; wallLine: string; furniture: string;
    furnitureDark: string; band: string; towel: string; ball: string; focus: string; coin: string;
}

export interface Bounds {
    centre: [number, number, number];
    radius: number;
}

export interface Stage {
    setExercise(ex: AnimExercise, bounds: Bounds): void;
    setView(name: "front" | "side" | "angled", animate?: boolean): void;
    update(solved: SolvedPose): void;
    resize(): void;
    rotate(dAz: number): void;
    setSkin(hex: string): void;
    setColours(colours: Colours): void;
    readonly azimuth: number;
}

export const LIGHT_COLOURS: Colours;
export const DARK_COLOURS: Colours;
export const DEFAULT_SKIN: string;

export function createStage(
    THREE: unknown,
    canvas: HTMLCanvasElement,
    options?: { colours?: Colours; skin?: string },
): Stage;
