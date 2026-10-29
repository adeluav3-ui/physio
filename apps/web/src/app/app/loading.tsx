export default function PatientLoading() {
    return (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Greeting */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skel" style={{ height: "16px", width: "100px" }} />
                <div className="skel" style={{ height: "28px", width: "160px" }} />
            </div>

            {/* Next session card */}
            <div className="skel-card" style={{ background: "#1b766e", border: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skel" style={{ height: "14px", width: "90px", background: "rgba(255,255,255,0.25)" }} />
                <div className="skel" style={{ height: "22px", width: "180px", background: "rgba(255,255,255,0.25)" }} />
                <div className="skel" style={{ height: "16px", width: "140px", background: "rgba(255,255,255,0.2)" }} />
                <div className="skel" style={{ height: "48px", marginTop: "6px", background: "rgba(255,255,255,0.3)", borderRadius: "10px" }} />
            </div>

            {/* Tasks card */}
            <div className="skel-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="skel" style={{ height: "18px", width: "120px" }} />
                    <div className="skel" style={{ height: "22px", width: "70px", borderRadius: "99px" }} />
                </div>
                <div className="skel" style={{ height: "8px", borderRadius: "99px" }} />
                <div className="skel" style={{ height: "14px", width: "75%" }} />
            </div>

            {/* Messages card */}
            <div className="skel-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="skel" style={{ height: "16px", width: "90px" }} />
                    <div className="skel" style={{ height: "14px", width: "130px" }} />
                </div>
                <div className="skel" style={{ height: "28px", width: "56px", borderRadius: "99px" }} />
            </div>

            {/* Streak card */}
            <div className="skel-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skel" style={{ height: "14px", width: "50px" }} />
                <div className="skel" style={{ height: "24px", width: "120px" }} />
            </div>
        </div>
    );
}
