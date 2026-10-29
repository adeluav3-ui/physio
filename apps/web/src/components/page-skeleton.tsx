/** Reusable skeleton primitives for loading.tsx files */

/** A generic list page: page title + N shimmer rows */
export function ListPageSkeleton({ rows = 5, title = true }: { rows?: number; title?: boolean }) {
    return (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {title && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div className="skel" style={{ height: "28px", width: "160px" }} />
                    <div className="skel" style={{ height: "40px", width: "100px", borderRadius: "10px" }} />
                </div>
            )}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skel-card" style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
                        <div className="skel" style={{ height: "16px", width: `${55 + (i % 3) * 15}%` }} />
                        <div className="skel" style={{ height: "13px", width: `${35 + (i % 2) * 20}%` }} />
                    </div>
                    <div className="skel" style={{ height: "28px", width: "28px", borderRadius: "99px", flexShrink: 0 }} />
                </div>
            ))}
        </div>
    );
}

/** A generic detail page: full-width header card + body sections */
export function DetailPageSkeleton() {
    return (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="skel" style={{ height: "24px", width: "180px" }} />
            <div className="skel-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="skel" style={{ height: "22px", width: "55%" }} />
                <div className="skel" style={{ height: "14px", width: "80%" }} />
                <div className="skel" style={{ height: "14px", width: "65%" }} />
            </div>
            {[1, 2].map(i => (
                <div key={i} className="skel-card" style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    <div className="skel" style={{ height: "18px", width: "120px" }} />
                    <div className="skel" style={{ height: "13px", width: "90%" }} />
                    <div className="skel" style={{ height: "13px", width: "70%" }} />
                </div>
            ))}
        </div>
    );
}
