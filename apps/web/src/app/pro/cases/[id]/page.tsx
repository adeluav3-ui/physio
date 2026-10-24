"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type DeviceCase = {
    id: string; patientName: string; deviceType: string; discipline: string;
    stage: number; openedAt: string;
    measurements?: Record<string, string>;
    nextVisit?: string; nextVisitTime?: string;
};

const STAGES = ["Consult", "Assessment", "Measure or cast", "Fabrication", "Fitting", "Follow-up"];
const KANBAN_STAGES = ["ASSESSMENT", "MEASURE", "FABRICATION", "FITTING"];

type KanbanItem = { patientName: string; deviceType: string; active?: boolean };

export default function DeviceCasePage() {
    const { id } = useParams<{ id: string }>();
    const [dc, setDc] = useState<DeviceCase | null>(null);
    const [m1, setM1] = useState(""); const [m2, setM2] = useState("");
    const [m3, setM3] = useState(""); const [m4, setM4] = useState("");

    useEffect(() => {
        fetch(`/api/proxy/device-cases/${id}`).then(r => r.ok ? r.json() : null).then(d => d && setDc(d)).catch(() => {});
    }, [id]);

    const stage = dc?.stage ?? 2;
    const patientName = dc?.patientName ?? "[Patient name]";
    const deviceType = dc?.deviceType ?? "[Device]";

    /* Stub kanban data */
    const kanban: Record<string, KanbanItem[]> = {
        ASSESSMENT: [{ patientName: "[Patient name]", deviceType: "Knee brace" }, { patientName: "[Patient name]", deviceType: "Spinal support" }],
        MEASURE: [{ patientName: patientName, deviceType: deviceType, active: true }],
        FABRICATION: [{ patientName: "[Patient name]", deviceType: "Below-knee prosthesis" }, { patientName: "[Patient name]", deviceType: "Insoles" }],
        FITTING: [{ patientName: "[Patient name]", deviceType: "Wrist splint" }],
    };

    return (
        <>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                <div>
                    <h1 style={{ font: "700 26px 'Figtree',sans-serif", margin: 0 }}>{patientName} · {deviceType}</h1>
                    <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "2px" }}>
                        Device case · {dc?.discipline ?? "Orthotist"}{dc?.openedAt ? ` · Opened ${new Date(dc.openedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </div>
                </div>
                <button type="button" className="btn">Update stage</button>
            </div>

            {/* Stage pipeline */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                {STAGES.map((s, i) => {
                    const done = i < stage;
                    const cur = i === stage;
                    return (
                        <div key={s} className={`stage${done ? " stdone" : cur ? " stcur" : ""}`}
                            style={{ flex: "1 1 150px" }}>
                            {i + 1}. {s}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>
                {/* Measurements */}
                <div className="card" style={{ flex: "1 1 380px" }}>
                    <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Measurements</h2>
                    <p className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "4px" }}>
                        Taken at a clinic visit. Fields come from the clinician{"'"}s template.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "12px", marginTop: "14px" }}>
                        {[
                            { id: "m1", label: "Left ankle width", val: m1, set: setM1 },
                            { id: "m2", label: "Calf circumference", val: m2, set: setM2 },
                            { id: "m3", label: "Foot length", val: m3, set: setM3 },
                            { id: "m4", label: "Shoe size", val: m4, set: setM4 },
                        ].map(({ id: fid, label, val, set }) => (
                            <div key={fid}>
                                <label htmlFor={fid} style={{ display: "block", font: "600 13px 'Figtree',sans-serif", marginBottom: "6px" }}>{label}</label>
                                <input id={fid} className="in" value={val} onChange={e => set(e.target.value)} placeholder="[measurement]" />
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: "14px", height: "110px", borderRadius: "12px", border: "1px dashed #b9c9c5", background: "#eef3f2", display: "flex", alignItems: "center", justifyContent: "center" }} className="muted">
                        <span style={{ font: "500 14px 'Figtree',sans-serif" }}>Photos of the limb and the cast</span>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ flex: "1 1 300px", display: "grid", gap: "20px" }}>
                    <div className="card">
                        <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Next visit</h2>
                        <div style={{ font: "700 20px 'Figtree',sans-serif", marginTop: "8px" }}>
                            {dc?.nextVisit ? `Clinic fitting · ${dc.nextVisit}` : "Not yet scheduled"}
                        </div>
                        <div className="muted" style={{ font: "400 14px 'Figtree',sans-serif", marginTop: "2px" }}>
                            Patient agreed to attend. Reminder set by email.
                        </div>
                    </div>
                    <div className="card">
                        <h2 style={{ font: "700 18px 'Figtree',sans-serif", margin: 0 }}>Linked care</h2>
                        <div style={{ display: "grid", gap: "10px", marginTop: "10px", font: "500 15px 'Figtree',sans-serif" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Referred by [Physiotherapist]</span>
                                <span className="chip">Summary due</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Gait training to follow</span>
                                <span className="chip warn">Refer back</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* All device cases Kanban */}
            <h2 style={{ font: "700 18px 'Figtree',sans-serif", marginTop: "28px" }}>All device cases</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
                {KANBAN_STAGES.map(s => (
                    <div key={s} className="col" style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <div className="muted" style={{ font: "700 13px 'Figtree',sans-serif" }}>{s} · {(kanban[s] ?? []).length}</div>
                        {(kanban[s] ?? []).map((item, i) => (
                            <div key={i} className="mini" style={item.active ? { borderColor: "#1b766e" } : {}}>
                                <div style={{ font: "600 14px 'Figtree',sans-serif" }}>{item.patientName}</div>
                                <div className="muted" style={{ font: "400 12px 'Figtree',sans-serif" }}>{item.deviceType}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
}
