export default function Loading() {
    return (
        <div className="p-6 animate-pulse">
            <div className="h-7 w-36 rounded bg-neutral-200 mb-1" />
            <div className="h-4 w-56 rounded bg-neutral-100 mb-6" />
            <div className="rounded-xl border border-border overflow-hidden">
                <div className="h-10 bg-neutral-50 border-b border-border" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 border-b border-border bg-white" />
                ))}
            </div>
        </div>
    );
}
