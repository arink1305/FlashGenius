import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useLang } from "../i18n";

const COLORS = ["#6366f1", "#f59e0b", "#06b6d4", "#10b981", "#ec4899", "#8b5cf6"];
const COL = 275;
const ROW = 56;
const NODE_H = 40;

function normNode(node) {
    if (typeof node === "string") return { title: node, children: [] };
    if (!node || typeof node !== "object") return { title: "?", children: [] };
    const title = node.title || node.name || node.label || node.topic || "?";
    const children = Array.isArray(node.children) ? node.children.map(normNode) : [];
    return { title, children };
}

function normalize(content, fallbackTitle) {
    if (!content || typeof content !== "object") return null;
    if (typeof content.title === "string" && Array.isArray(content.children)) return normNode(content);
    if (content.central || content.branches) {
        return { title: content.central || fallbackTitle || "Tankekart", children: (content.branches || []).map(normNode) };
    }
    const keys = Object.keys(content);
    if (keys.length === 1) {
        const k = keys[0];
        const v = content[k];
        if (Array.isArray(v)) return { title: k, children: v.map(normNode) };
        if (v && typeof v === "object") {
            const children = Array.isArray(v.children) ? v.children.map(normNode) : [];
            return { title: k, children };
        }
    }
    return null;
}

function layout(tree, expanded) {
    const nodes = [];
    const links = [];
    let leaf = 0;

    function walk(node, id, depth, parentId, color) {
        const has = Array.isArray(node.children) && node.children.length > 0;
        const open = expanded.has(id);
        const x = depth * COL;
        let y;
        if (has && open) {
            const ys = [];
            node.children.forEach((child, i) => {
                const childColor = depth === 0 ? COLORS[i % COLORS.length] : color;
                ys.push(walk(child, `${id}-${i}`, depth + 1, id, childColor));
                links.push({ id: `${id}->${id}-${i}`, from: id, to: `${id}-${i}`, color: childColor });
            });
            y = (ys[0] + ys[ys.length - 1]) / 2;
        } else {
            y = leaf * ROW + ROW / 2;
            leaf++;
        }
        nodes.push({ id, title: node.title, depth, x, y, color, has, open, parentId });
        return y;
    }

    walk(tree, "0", 0, null, "#1a1040");
    const width = Math.max(...nodes.map((n) => n.x), 0) + 230;
    const height = Math.max(leaf * ROW, ROW) + 20;
    return { nodes, links, width, height };
}

function curve(x1, y1, x2, y2) {
    const dx = Math.max(24, (x2 - x1) * 0.45);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function Mindmap() {
    const { deckId } = useParams();
    const { t } = useLang();
    const [deck, setDeck] = useState(null);
    const [expanded, setExpanded] = useState(new Set(["0"]));
    const [paths, setPaths] = useState([]);
    const wrapRef = useRef(null);

    useEffect(() => {
        api.get(`/flashcards/decks/${deckId}`).then((res) => setDeck(res.data));
    }, [deckId]);

    const tree = useMemo(() => (deck ? normalize(deck.content, deck.title) : null), [deck]);
    const { nodes, links, width, height } = useMemo(
        () => (tree ? layout(tree, expanded) : { nodes: [], links: [], width: 0, height: 0 }),
        [tree, expanded]
    );

    const drawConnectors = useCallback(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const box = wrap.getBoundingClientRect();
        const next = [];
        for (const link of links) {
            const a = wrap.querySelector(`[data-node="${link.from}"]`);
            const b = wrap.querySelector(`[data-node="${link.to}"]`);
            if (!a || !b) continue;
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const x1 = ra.right - box.left + wrap.scrollLeft;
            const y1 = ra.top + ra.height / 2 - box.top + wrap.scrollTop;
            const x2 = rb.left - box.left + wrap.scrollLeft;
            const y2 = rb.top + rb.height / 2 - box.top + wrap.scrollTop;
            next.push({ id: link.id, d: curve(x1, y1, x2, y2), color: link.color });
        }
        setPaths(next);
    }, [links]);

    useLayoutEffect(() => {
        if (!tree) return;
        drawConnectors();
        let raf;
        const start = performance.now();
        const loop = (now) => {
            drawConnectors();
            if (now - start < 480) raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [tree, expanded, drawConnectors]);

    function toggle(id) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                for (const key of [...next]) if (key === id || key.startsWith(id + "-")) next.delete(key);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    if (!deck) {
        return (
            <div className="page">
                <div className="content"><div style={{ fontSize: "2rem", marginTop: "80px", textAlign: "center" }}>⏳</div></div>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </header>

            <main className="content">
                <div className="study-hero">
                    <div className="study-hero-text">
                        <h1>🧠 {deck.title}</h1>
                        <p>{t("mindmapHeroSub")}</p>
                    </div>
                </div>

                <div className="mm2-scroll" ref={wrapRef}>
                    <div className="mm2-canvas" style={{ width, height }}>
                        <svg className="mm2-svg" width={width} height={height}>
                            {paths.map((p) => (
                                <path key={p.id} className="mm2-link" d={p.d} stroke={p.color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            ))}
                        </svg>

                        {nodes.map((n) => (
                            <div
                                key={n.id}
                                data-node={n.id}
                                className={`mm2-node ${n.depth === 0 ? "root" : ""} ${n.has ? "has-children" : ""} ${n.open ? "open" : ""}`}
                                style={{
                                    transform: `translate(${n.x}px, ${n.y - NODE_H / 2}px)`,
                                    "--branch": n.color,
                                }}
                                onClick={() => n.has && toggle(n.id)}
                                title={n.title}
                            >
                                <span className="mm2-label">{n.title}</span>
                                {n.has && <span className="mm2-toggle">{n.open ? "−" : "+"}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
