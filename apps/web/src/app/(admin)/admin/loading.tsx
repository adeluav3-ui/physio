export default function AdminLoading() {
    return (
        <div style={{ padding: "24px" }}>
            {/* Title */}
            <div className="skel" style={{ height: "28px", width: "140px" }} />
            <div className="skel" style={{ height: "14px", width: "320px", marginTop: "8px" }} />

            {/* 3-column stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "12px", marginTop: "24px" }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="skel-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className="skel" style={{ height: "12px", width: "70%" }} />
                        <div className="skel" style={{ height: "36px", width: "60px" }} />
                        <div className="skel" style={{ height: "14px", width: "90px" }} />
                    </div>
                ))}
            </div>

            {/* Second row: wider cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "12px", marginTop: "12px" }}>
                {[1, 2].map(i => (
                    <div key={i} className="skel-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div className="skel" style={{ height: "18px", width: "120px" }} />
                        {[1, 2, 3].map(j => (
                            <div key={j} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <div className="skel" style={{ height: "14px", flex: 1 }} />
                                <div className="skel" style={{ height: "24px", width: "60px", borderRadius: "99px", flexShrink: 0 }} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
