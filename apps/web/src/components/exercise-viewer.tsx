"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimExercise } from "@physio/exercise-animation/engine/sampler.js";
import type { Stage, Bounds } from "@physio/exercise-animation/engine/stage.js";
import type { SolvedPose } from "@physio/exercise-animation/engine/skeleton.js";

export type ViewName = "front" | "side" | "angled";

export interface ExerciseViewerProps {
    csvId: string;
    side?: "left" | "right";
    /** Initial camera view. Defaults to the exercise's own defaultView. */
    initialView?: ViewName;
    className?: string;
}

function computeBounds(
    ex: AnimExercise,
    solve: (pose: unknown, pins: unknown) => SolvedPose,
): Bounds {
    const lo: [number, number, number] = [Infinity, Infinity, Infinity];
    const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < 24; i++) {
        const s = ex.sample((i / 24) * ex.duration);
        const solved = solve(s.pose, s.pins);
        const names = ex.fit;
        const pts = names
            ? names.map((n) => solved.seg[n]?.p).filter(Boolean) as [number, number, number][]
            : Object.values(solved.seg).map((v) => v.p);
        for (const p of pts) {
            for (let a = 0; a < 3; a++) {
                lo[a] = Math.min(lo[a]!, (p as number[])[a]!);
                hi[a] = Math.max(hi[a]!, (p as number[])[a]!);
            }
        }
    }
    const centre: [number, number, number] = [
        (lo[0] + hi[0]) / 2,
        (lo[1] + hi[1]) / 2,
        (lo[2] + hi[2]) / 2,
    ];
    const radius =
        Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 +
        (ex.fit ? (ex.margin ?? 0.14) : 0.2);
    return { centre, radius };
}

export default function ExerciseViewer({
    csvId,
    side = "left",
    initialView,
    className,
}: ExerciseViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Stage | null>(null);
    const exRef = useRef<AnimExercise | null>(null);
    const animRef = useRef<number>(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState("");
    const [currentView, setCurrentView] = useState<ViewName>("angled");

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;
        const canvas = canvasRef.current;
        const container = containerRef.current;
        let mounted = true;

        async function init() {
            try {
                const [THREE, { buildExercise }, { solve }, { createStage, LIGHT_COLOURS }] =
                    await Promise.all([
                        import("three"),
                        import("@physio/exercise-animation/engine/sampler.js"),
                        import("@physio/exercise-animation/engine/skeleton.js"),
                        import("@physio/exercise-animation/engine/stage.js"),
                    ]);

                const res = await fetch("/exercise-data/poses.json");
                if (!res.ok) throw new Error("Failed to load exercise data");
                const poses: unknown = await res.json();

                if (!mounted) return;

                const ex = buildExercise(poses, csvId, side);
                if (!ex) {
                    setError("No animation available for this exercise yet.");
                    setLoading(false);
                    return;
                }

                const stage = createStage(THREE, canvas, { colours: LIGHT_COLOURS });
                stageRef.current = stage;
                exRef.current = ex;

                const bounds = computeBounds(ex, solve);
                stage.setExercise(ex, bounds);

                const view = (initialView ?? ex.defaultView) as ViewName;
                stage.setView(view, false);
                setCurrentView(view);

                const ro = new ResizeObserver(() => stage.resize());
                ro.observe(container);
                stage.resize();

                setLoading(false);

                // Animation loop
                let elapsed = 0;
                let last = performance.now();

                function loop() {
                    if (!mounted) return;
                    animRef.current = requestAnimationFrame(loop);
                    const now = performance.now();
                    elapsed += (now - last) / 1000;
                    last = now;

                    const curEx = exRef.current;
                    if (!curEx || !stageRef.current) return;
                    const s = curEx.sample(elapsed);
                    const solved: SolvedPose = { ...solve(s.pose, s.pins), time: s.t };
                    stageRef.current.update(solved);
                    setPhase(s.phase);
                }
                animRef.current = requestAnimationFrame(loop);
            } catch (e) {
                if (mounted) {
                    setError((e as Error).message);
                    setLoading(false);
                }
            }
        }

        setLoading(true);
        setError(null);
        setPhase("");
        init();

        return () => {
            mounted = false;
            cancelAnimationFrame(animRef.current);
            stageRef.current = null;
            exRef.current = null;
        };
    }, [csvId, side, initialView]);

    function handleViewChange(v: ViewName) {
        setCurrentView(v);
        stageRef.current?.setView(v);
    }

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                background: "#dfe8f0",
                borderRadius: "12px",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />

            {loading && (
                <div style={overlay}>
                    <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478" }}>
                        Loading animation…
                    </span>
                </div>
            )}

            {error && (
                <div style={{ ...overlay, background: "#f8f9fa" }}>
                    <span style={{ font: "400 13px 'Figtree',sans-serif", color: "#4f6478", textAlign: "center", padding: "0 16px" }}>
                        {error}
                    </span>
                </div>
            )}

            {!loading && !error && (
                <>
                    {phase && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "44px",
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                font: "500 11px 'Figtree',sans-serif",
                                color: "#022449",
                                pointerEvents: "none",
                                letterSpacing: "0.02em",
                            }}
                        >
                            {phase}
                        </div>
                    )}

                    <div
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: "4px",
                        }}
                    >
                        {(["front", "side", "angled"] as const).map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => handleViewChange(v)}
                                style={{
                                    padding: "3px 10px",
                                    borderRadius: "10px",
                                    border: "1.5px solid",
                                    borderColor: currentView === v ? "#1b7d0e" : "#b4c4d3",
                                    background:
                                        currentView === v ? "#1b7d0e" : "rgba(255,255,255,0.85)",
                                    color: currentView === v ? "#fff" : "#022449",
                                    font: "500 11px 'Figtree',sans-serif",
                                    cursor: "pointer",
                                    backdropFilter: "blur(4px)",
                                }}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const overlay: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dfe8f0",
};
