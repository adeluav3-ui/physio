"use client";

import { Button, cn } from "@physio/ui";
import { useState } from "react";

export type VideoCallLayoutProps = {
    role: "PATIENT" | "PHYSIO";
    videoSlot: React.ReactNode;
    toolsSlot?: React.ReactNode;
    controls: {
        micOn: boolean;
        cameraOn: boolean;
        onToggleMic: () => void;
        onToggleCamera: () => void;
        onLeave: () => void;
        onToggleTools?: () => void;
    };
    connectionQuality?: "good" | "fair" | "poor";
};

export function VideoCallLayout({
    role,
    videoSlot,
    toolsSlot,
    controls,
    connectionQuality = "good",
}: VideoCallLayoutProps) {
    const [toolsOpen, setToolsOpen] = useState(false);
    const isPhysio = role === "PHYSIO";

    return (
        <div className="flex h-screen flex-col bg-neutral-900">
            {connectionQuality !== "good" && (
                <div
                    className={cn(
                        "px-4 py-2 text-center text-sm",
                        connectionQuality === "fair" ? "bg-warning-500 text-black" : "bg-danger-500 text-white",
                    )}
                >
                    {connectionQuality === "fair"
                        ? "Connection is weak — try moving closer to your router."
                        : "Poor connection. Consider turning off your camera."}
                </div>
            )}

            <div className="relative flex flex-1 overflow-hidden">
                <div className={cn("relative flex-1", isPhysio && toolsOpen && "lg:max-w-[70%]")}>
                    {videoSlot}
                </div>

                {isPhysio && toolsSlot && (
                    <>
                        {/* Desktop: side panel */}
                        <aside
                            className={cn(
                                "hidden border-l border-neutral-800 bg-neutral-950 lg:block",
                                toolsOpen ? "w-[30%] min-w-[320px]" : "w-0",
                            )}
                        >
                            {toolsOpen && <div className="h-full overflow-y-auto p-4">{toolsSlot}</div>}
                        </aside>

                        {/* Mobile: bottom sheet */}
                        {toolsOpen && (
                            <div className="absolute inset-x-0 bottom-0 top-1/3 z-20 rounded-t-xl bg-neutral-950 lg:hidden">
                                <div className="h-full overflow-y-auto p-4">{toolsSlot}</div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex items-center justify-center gap-3 bg-neutral-950 p-4">
                <RoundControl active={controls.micOn} onClick={controls.onToggleMic} label={controls.micOn ? "Mute" : "Unmute"}>
                    {controls.micOn ? "🎤" : "🔇"}
                </RoundControl>
                <RoundControl
                    active={controls.cameraOn}
                    onClick={controls.onToggleCamera}
                    label={controls.cameraOn ? "Turn camera off" : "Turn camera on"}
                >
                    {controls.cameraOn ? "📹" : "📷"}
                </RoundControl>
                {isPhysio && controls.onToggleTools && (
                    <RoundControl active={toolsOpen} onClick={() => { setToolsOpen((v) => !v); controls.onToggleTools?.(); }} label="Tools">
                        🧰
                    </RoundControl>
                )}
                <Button variant="danger" onClick={controls.onLeave} className="ml-4">
                    Leave
                </Button>
            </div>
        </div>
    );
}

function RoundControl({
    active,
    onClick,
    label,
    children,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-xl transition-colors",
                active ? "bg-neutral-800 text-white" : "bg-danger-500 text-white",
            )}
        >
            {children}
        </button>
    );
}