export function SkeletonLine({ w = "100%", h = 14, r = 8, style }) {
    return <span className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function DeckGridSkeleton({ count = 6 }) {
    return (
        <div className="deck-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="deck-card skeleton-card" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                        <SkeletonLine w={44} h={44} r={12} />
                        <SkeletonLine w={80} h={24} r={99} />
                    </div>
                    <SkeletonLine w="75%" h={18} style={{ marginBottom: 10 }} />
                    <SkeletonLine w="45%" h={12} style={{ marginBottom: 24 }} />
                    <div style={{ display: "flex", gap: 10 }}>
                        <SkeletonLine w={110} h={40} r={12} />
                        <SkeletonLine w={80} h={40} r={12} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ViewerSkeleton() {
    return (
        <div className="viewer-skeleton">
            <div className="skeleton-hero skeleton" />
            <div className="skeleton-body skeleton" />
        </div>
    );
}
