export default function ProLoading() {
    return (
        <>
            {/* Heading row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div className="skel" style={{ height: "32px", width: "220px" }} />
                <div className="skel" style={{ height: "48px", width: "160px", borderRadius: "10px" }} />
            </div>

            {/* 4 stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "14px", marginTop: "20px" }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skel-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className="skel" style={{ height: "13px", width: "80px" }} />
                        <div className="skel" style={{ height: "34px", width: "48px" }} />
                    </div>
                ))}
            </div>

            {/* Two content cards */}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "20px", marginTop: "20px", alignItems: "flex-start" }}>
                <div className="skel-card" style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className="skel" style={{ height: "20px", width: "60px" }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <div className="skel" style={{ height: "16px", width: "56px", flexShrink: 0 }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                                <div className="skel" style={{ height: "15px", width: "70%" }} />
                                <div className="skel" style={{ height: "13px", width: "50%" }} />
                            </div>
                            <div className="skel" style={{ height: "36px", width: "56px", borderRadius: "10px", flexShrink: 0 }} />
                        </div>
                    ))}
                </div>

                <div className="skel-card" style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="skel" style={{ height: "20px", width: "140px" }} />
                    <div className="skel" style={{ height: "14px", width: "90%" }} />
                    <div className="skel" style={{ height: "14px", width: "65%" }} />
                </div>
            </div>
        </>
    );
}
