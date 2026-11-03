"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
    label: string;
    accept?: string;
    value: string;
    onChange: (url: string) => void;
    hint?: string;
    /** Show a circular image preview (for profile photos) */
    preview?: boolean;
}

type Status = "idle" | "uploading" | "done" | "error";

export function FileUpload({ label, accept = ".pdf,.jpg,.jpeg,.png,.webp", value, onChange, hint, preview = false }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<Status>(value ? "done" : "idle");
    const [fileName, setFileName] = useState("");
    const [errMsg, setErrMsg] = useState("");

    async function handleFile(file: File) {
        setStatus("uploading");
        setErrMsg("");
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const text = await res.text();
            let body: { message?: string; url?: string } = {};
            try { body = JSON.parse(text); } catch { body = { message: text.slice(0, 200) || "Upload failed" }; }
            if (!res.ok) throw new Error(body.message ?? "Upload failed");
            onChange(body.url as string);
            setFileName(file.name);
            setStatus("done");
        } catch (e) {
            setErrMsg((e as Error).message);
            setStatus("error");
        }
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    const isImage = value && (value.includes(".jpg") || value.includes(".jpeg") || value.includes(".png") || value.includes(".webp") || value.startsWith("data:image"));

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <label style={{ font: "600 13px 'Figtree',sans-serif" }}>{label}</label>
                {hint && <span style={{ font: "400 12px 'Figtree',sans-serif", color: "#4f6478" }}>{hint}</span>}
            </div>

            {/* Profile photo circular preview */}
            {preview && value && isImage && (
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                    <img src={value} alt="Profile preview" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "2px solid #d9e3ec" }} />
                </div>
            )}

            <div
                style={{
                    border: `1.5px dashed ${status === "error" ? "#e53e3e" : status === "done" ? "#1b7d0e" : "#b4c4d3"}`,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    background: status === "done" ? "#eef3f8" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap" as const,
                }}
            >
                <button
                    type="button"
                    className="btn btn2"
                    style={{ minHeight: "36px", fontSize: "13px", flexShrink: 0 }}
                    disabled={status === "uploading"}
                    onClick={() => inputRef.current?.click()}
                >
                    {status === "uploading" ? "Uploading…" : status === "done" ? "Replace" : "Choose file"}
                </button>

                <span style={{ font: "400 13px 'Figtree',sans-serif", color: status === "error" ? "#8f1d1d" : status === "done" ? "#0f5a08" : "#4f6478", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {status === "uploading" && "Uploading…"}
                    {status === "done" && (fileName || "Uploaded ✓")}
                    {status === "error" && (errMsg || "Upload failed")}
                    {status === "idle" && "No file chosen"}
                </span>

                {status === "done" && value && (
                    <a href={value} target="_blank" rel="noopener noreferrer" style={{ font: "600 12px 'Figtree',sans-serif", color: "#1b7d0e", flexShrink: 0 }}>
                        View
                    </a>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    style={{ display: "none" }}
                    onChange={onInputChange}
                />
            </div>
        </div>
    );
}
