import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize, X, Plus, Minus, Network } from "lucide-react";
import Topbar from "../components/Topbar";
import ShareButton from "../components/ShareButton";
import { ViewerSkeleton } from "../components/Skeleton";
import api from "../api";
import { useLang } from "../i18n";

const COLORS = ["#6366f1", "#f59e0b", "#06b6d4", "#10b981", "#ec4899", "#8b5cf6"];
const COL = 320;
const ROW = 72;
const NODE_H = 52;

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
    const width = Math.max(...nodes.map((n) => n.x), 0) + 260;
    const height = Math.max(leaf * ROW, ROW) + 20;
    return { nodes, links, width, height };
}

function curve(x1, y1, x2, y2) {
    const dx = Math.max(30, (x2 - x1) * 0.5);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function collectIds(node, id, out) {
    if (node.children?.length) {
        out.push(id);
        node.children.forEach((child, i) => collectIds(child, `${id}-${i}`, out));
    }
    return out;
}

function pathTo(tree, id) {
    const parts = id.split("-").map(Number);
    const titles = [];
    let node = tree;
    titles.push(node.title);
    for (let i = 1; i < parts.length; i++) {
        node = node.children[parts[i]];
        if (!node) break;
        titles.push(node.title);
    }
    return titles;
}

function isRelated(hoverId, nodeId) {
    return (
        hoverId === nodeId ||
        hoverId.startsWith(nodeId + "-") ||
        nodeId.startsWith(hoverId + "-")
    );
}

export default function Mindmap() {
    const { deckId } = useParams();
    const { t } = useLang();
    const [deck, setDeck] = useState(null);
    const [expanded, setExpanded] = useState(new Set(["0"]));
    const [paths, setPaths] = useState([]);
    const [scale, setScale] = useState(1);
    const [modal, setModal] = useState(null);
    const [hoverId, setHoverId] = useState(null);
    const wrapRef = useRef(null);
    const zoomRef = useRef(null);
    const dragRef = useRef(null);

    useEffect(() => {
        api.get(`/flashcards/decks/${deckId}`).then((res) => setDeck(res.data));
    }, [deckId]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") setModal(null);
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const tree = useMemo(() => (deck ? normalize(deck.content, deck.title) : null), [deck]);
    const { nodes, links, width, height } = useMemo(
        () => (tree ? layout(tree, expanded) : { nodes: [], links: [], width: 0, height: 0 }),
        [tree, expanded]
    );

    const drawConnectors = useCallback(() => {
        const zoom = zoomRef.current;
        if (!zoom) return;
        const zbox = zoom.getBoundingClientRect();
        const next = [];
        for (const link of links) {
            const a = zoom.querySelector(`[data-node="${link.from}"]`);
            const b = zoom.querySelector(`[data-node="${link.to}"]`);
            if (!a || !b) continue;
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const x1 = (ra.right - zbox.left) / scale;
            const y1 = (ra.top + ra.height / 2 - zbox.top) / scale;
            const x2 = (rb.left - zbox.left) / scale;
            const y2 = (rb.top + rb.height / 2 - zbox.top) / scale;
            next.push({ id: link.id, from: link.from, to: link.to, d: curve(x1, y1, x2, y2), color: link.color });
        }
        setPaths(next);
    }, [links, scale]);

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
    }, [tree, expanded, scale, drawConnectors]);

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

    function expandAll() {
        if (!tree) return;
        setExpanded(new Set(collectIds(tree, "0", [])));
    }

    function collapseAll() {
        setExpanded(new Set(["0"]));
    }

    function center() {
        setScale(1);
        const wrap = wrapRef.current;
        if (wrap) wrap.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }

    function onMouseDown(e) {
        if (e.target.closest(".mm2-node")) return;
        const wrap = wrapRef.current;
        dragRef.current = { x: e.clientX, y: e.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop };
        wrap.classList.add("dragging");
    }

    function onMouseMove(e) {
        const d = dragRef.current;
        if (!d) return;
        const wrap = wrapRef.current;
        wrap.scrollLeft = d.sl - (e.clientX - d.x);
        wrap.scrollTop = d.st - (e.clientY - d.y);
    }

    function endDrag() {
        dragRef.current = null;
        wrapRef.current?.classList.remove("dragging");
    }

    if (!deck) {
        return (
            <div className="page">
                <Topbar>
                    <Link to="/" className="btn-ghost">{t("back")}</Link>
                </Topbar>
                <main className="content">
                    <ViewerSkeleton />
                </main>
            </div>
        );
    }

    const modalPath = modal && tree ? pathTo(tree, modal.id) : [];

    return (
        <div className="page">
            <Topbar>
                <ShareButton deckId={deckId} />
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </Topbar>

            <main className="content">
                <div className="study-hero">
                    <div className="study-hero-text">
                        <h1><Network size={20} style={{ marginRight: 8, verticalAlign: "-3px" }} />{deck.title}</h1>
                        <p>{t("mindmapHeroSub")}</p>
                    </div>
                    <div className="mm2-controls">
                        <button className="mm2-ctrl-btn" onClick={() => setScale((s) => Math.min(1.6, +(s + 0.15).toFixed(2)))} title={t("mmZoomIn")} aria-label={t("mmZoomIn")}>
                            <ZoomIn size={16} />
                        </button>
                        <button className="mm2-ctrl-btn" onClick={() => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))} title={t("mmZoomOut")} aria-label={t("mmZoomOut")}>
                            <ZoomOut size={16} />
                        </button>
                        <button className="mm2-ctrl-btn" onClick={center} title={t("mmCenter")} aria-label={t("mmCenter")}>
                            <Maximize size={16} />
                        </button>
                        <button className="mm2-ctrl-btn text" onClick={expandAll}>{t("mmExpandAll")}</button>
                        <button className="mm2-ctrl-btn text" onClick={collapseAll}>{t("mmCollapse")}</button>
                    </div>
                </div>

                <div
                    className="mm2-scroll"
                    ref={wrapRef}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                >
                    <div className="mm2-canvas" style={{ width: width * scale, height: height * scale }}>
                        <div className="mm2-zoom" ref={zoomRef} style={{ transform: `scale(${scale})`, width, height }}>
                            <svg className="mm2-svg" width={width} height={height}>
                                {paths.map((p) => {
                                    const dimmed = hoverId && !(isRelated(hoverId, p.from) && isRelated(hoverId, p.to));
                                    return (
                                        <path
                                            key={p.id}
                                            className={`mm2-link ${dimmed ? "dim" : ""} ${hoverId && !dimmed ? "lit" : ""}`}
                                            d={p.d}
                                            style={{ "--branch-stroke": p.color }}
                                            fill="none"
                                            strokeLinecap="round"
                                        />
                                    );
                                })}
                            </svg>

                            {nodes.map((n) => {
                                const dimmed = hoverId && !isRelated(hoverId, n.id);
                                return (
                                    <div
                                        key={n.id}
                                        data-node={n.id}
                                        className={`mm2-node ${n.depth === 0 ? "root" : ""} ${n.has ? "has-children" : ""} ${n.open ? "open" : ""} ${dimmed ? "dim" : ""}`}
                                        style={{
                                            transform: `translate(${n.x}px, ${n.y - NODE_H / 2}px)`,
                                            "--branch": n.color,
                                        }}
                                        onClick={() => setModal({ id: n.id, title: n.title, color: n.color })}
                                        onMouseEnter={() => setHoverId(n.id)}
                                        onMouseLeave={() => setHoverId(null)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === "Enter") setModal({ id: n.id, title: n.title, color: n.color }); }}
                                    >
                                        <span className="mm2-label">{n.title}</span>
                                        {n.has && (
                                            <button
                                                className="mm2-toggle"
                                                onClick={(e) => { e.stopPropagation(); toggle(n.id); }}
                                                aria-label={n.open ? t("mmCollapse") : t("mmExpandAll")}
                                            >
                                                {n.open ? <Minus size={12} /> : <Plus size={12} />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {modal && (
                    <motion.div
                        className="mm2-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => setModal(null)}
                    >
                        <motion.div
                            className="mm2-modal"
                            style={{ "--branch": modal.color }}
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="mm2-modal-close" onClick={() => setModal(null)} aria-label={t("mmClose")}>
                                <X size={16} />
                            </button>
                            {modalPath.length > 1 && (
                                <p className="mm2-modal-path">
                                    {modalPath.slice(0, -1).join("  ›  ")}
                                </p>
                            )}
                            <h2 className="mm2-modal-title">{modal.title}</h2>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
