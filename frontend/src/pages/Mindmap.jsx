import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

const COLORS = ["#6366f1", "#f59e0b", "#06b6d4", "#10b981", "#ec4899", "#8b5cf6"];

function curve(x1, y1, x2, y2) {
    const dx = Math.max(28, (x2 - x1) * 0.5);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function Mindmap() {
    const { deckId } = useParams();
    const [deck, setDeck] = useState(null);
    const treeRef = useRef(null);
    const [paths, setPaths] = useState([]);
    const [size, setSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        api.get(`/flashcards/decks/${deckId}`).then((res) => setDeck(res.data));
    }, [deckId]);

    const compute = useCallback(() => {
        const container = treeRef.current;
        if (!container) return;
        const box = container.getBoundingClientRect();
        const rightOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.right - box.left, y: r.top - box.top + r.height / 2 }; };
        const leftOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - box.left, y: r.top - box.top + r.height / 2 }; };

        const central = container.querySelector('[data-mm="central"]');
        if (!central) return;
        const c = rightOf(central);
        const next = [];

        container.querySelectorAll("[data-branch]").forEach((bEl) => {
            const i = Number(bEl.getAttribute("data-branch"));
            const color = COLORS[i % COLORS.length];
            next.push({ d: curve(c.x, c.y, leftOf(bEl).x, leftOf(bEl).y), color });
            const br = rightOf(bEl);
            container.querySelectorAll(`[data-child^="${i}-"]`).forEach((chEl) => {
                const cl = leftOf(chEl);
                next.push({ d: curve(br.x, br.y, cl.x, cl.y), color });
            });
        });

        setPaths(next);
        setSize({ w: box.width, h: box.height });
    }, []);

    useLayoutEffect(() => {
        if (!deck) return;
        compute();
        const ro = new ResizeObserver(compute);
        if (treeRef.current) ro.observe(treeRef.current);
        window.addEventListener("resize", compute);
        const t = setTimeout(compute, 120);
        return () => { ro.disconnect(); window.removeEventListener("resize", compute); clearTimeout(t); };
    }, [deck, compute]);

    if (!deck) {
        return (
            <div className="page">
                <div className="content"><div style={{ fontSize: "2rem", marginTop: "80px", textAlign: "center" }}>⏳</div></div>
            </div>
        );
    }

    const content = deck.content || {};
    const branches = content.branches || [];

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/" className="btn-ghost">← Tilbake</Link>
            </header>

            <main className="content">
                <div className="study-hero">
                    <div className="study-hero-text">
                        <h1>🧠 {deck.title}</h1>
                        <p>Visuelt tankekart</p>
                    </div>
                </div>

                <div className="mm-scroll">
                    <div className="mm-tree" ref={treeRef}>
                        <svg className="mm-svg" width={size.w} height={size.h}>
                            {paths.map((p, i) => (
                                <path key={i} d={p.d} stroke={p.color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            ))}
                        </svg>

                        <div className="mm-central" data-mm="central">{content.central || deck.title}</div>

                        <div className="mm-branches">
                            {branches.map((branch, i) => (
                                <div className="mm-branch-row" key={i}>
                                    <div
                                        className="mm-branch-node"
                                        data-branch={i}
                                        style={{ borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}
                                    >
                                        {branch.title}
                                    </div>
                                    <div className="mm-children">
                                        {(branch.children || []).map((child, j) => (
                                            <div className="mm-child" data-child={`${i}-${j}`} key={j}>{child}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
