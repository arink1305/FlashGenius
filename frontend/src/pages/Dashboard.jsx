import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Settings as SettingsIcon, LogOut, FolderPlus, FolderInput,
    Pencil, Trash2, Check, X, Layers as LayersIcon, Folder as FolderIcon,
    Flame, ChartColumn, Lock, Sparkles,
} from "lucide-react";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import Folder from "../components/Folder";
import { DeckGridSkeleton } from "../components/Skeleton";
import api from "../api";
import { DECK_TYPES, deckRoute } from "../deckTypes";
import { useLang } from "../i18n";
import { useMe, hasTier } from "../useMe";

const actionKey = {
    flashcards: "actionFlashcards",
    quiz: "actionQuiz",
    summary: "actionSummary",
    mindmap: "actionMindmap",
};

function getEmail() {
    try {
        const token = localStorage.getItem("token");
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.email || payload.sub || "Ukjent";
    } catch {
        return "Ukjent";
    }
}

function getInitial(email) {
    return email ? email[0].toUpperCase() : "?";
}

export default function Dashboard() {
    const { t, lang } = useLang();
    const me = useMe();
    const [decks, setDecks] = useState(null);
    const [folders, setFolders] = useState([]);
    const [activeFolder, setActiveFolder] = useState(null);
    const [creating, setCreating] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [moveMenuId, setMoveMenuId] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const profileRef = useRef(null);
    const navigate = useNavigate();
    const email = getEmail();
    const isPro = hasTier(me, "pro");

    useEffect(() => {
        api.get("/flashcards/decks").then((res) => setDecks(res.data)).catch(() => setDecks([]));
        api.get("/flashcards/folders").then((res) => setFolders(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (isPro) {
            api.get("/flashcards/stats").then((res) => setStats(res.data)).catch(() => {});
        }
    }, [isPro]);

    useEffect(() => {
        function handleClick(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (!e.target.closest(".deck-move-wrap")) setMoveMenuId(null);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const folderCounts = useMemo(() => {
        const counts = {};
        for (const d of decks || []) {
            if (d.folder_id) counts[d.folder_id] = (counts[d.folder_id] || 0) + 1;
        }
        return counts;
    }, [decks]);

    const visibleDecks = useMemo(() => {
        if (!decks) return [];
        if (activeFolder === null) return decks;
        return decks.filter((d) => d.folder_id === activeFolder);
    }, [decks, activeFolder]);

    async function deleteDeck(id) {
        await api.delete(`/flashcards/decks/${id}`);
        setDecks(decks.filter((d) => d.id !== id));
    }

    async function createFolder() {
        const name = folderName.trim();
        if (!name) return;
        const res = await api.post("/flashcards/folders", { name });
        setFolders([...folders, { id: res.data.id, name: res.data.name }]);
        setFolderName("");
        setCreating(false);
    }

    async function renameFolder(id) {
        const name = renameValue.trim();
        if (!name) return;
        await api.put(`/flashcards/folders/${id}`, { name });
        setFolders(folders.map((f) => (f.id === id ? { ...f, name } : f)));
        setRenamingId(null);
    }

    async function deleteFolder(id) {
        if (!window.confirm(t("deleteFolderConfirm"))) return;
        await api.delete(`/flashcards/folders/${id}`);
        setFolders(folders.filter((f) => f.id !== id));
        setDecks(decks.map((d) => (d.folder_id === id ? { ...d, folder_id: null } : d)));
        if (activeFolder === id) setActiveFolder(null);
    }

    async function moveDeck(deckId, folderId) {
        await api.put(`/flashcards/decks/${deckId}/folder`, { folder_id: folderId });
        setDecks(decks.map((d) => (d.id === deckId ? { ...d, folder_id: folderId } : d)));
        setMoveMenuId(null);
    }

    function logout() {
        localStorage.removeItem("token");
        navigate("/login");
    }

    const tierLabel = { free: t("planFree"), plus: t("planPlus"), pro: t("planPro"), ultra: t("planUltra") }[me?.tier || "free"];

    return (
        <div className="page">
            <Topbar>
                <Link to="/new" className="btn-primary">
                    <Plus size={16} /> {t("newSet")}
                </Link>
                {isPro && (
                    <Link to="/stats" className="topbar-icon-btn" title={t("viewStats")} aria-label={t("viewStats")}>
                        <ChartColumn size={18} />
                    </Link>
                )}
                <Link to="/settings" className="topbar-icon-btn" title={t("settingsTitle")} aria-label={t("settingsTitle")}>
                    <SettingsIcon size={18} />
                </Link>
                <div className="profile-wrap" ref={profileRef}>
                    <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)} aria-label={t("account")}>
                        <span className="profile-avatar">{getInitial(email)}</span>
                    </button>
                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                className="profile-dropdown"
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.16 }}
                            >
                                <div className="profile-info">
                                    <div className="profile-avatar-lg">{getInitial(email)}</div>
                                    <div>
                                        <p className="profile-email">{email}</p>
                                        <p className="profile-label">{t("account")}</p>
                                    </div>
                                </div>
                                <div className="profile-divider" />
                                <div className="profile-meta">
                                    <div className="profile-meta-row">
                                        <span>{t("setsCount")}</span>
                                        <strong>{decks?.length ?? 0}</strong>
                                    </div>
                                    <div className="profile-meta-row">
                                        <span>{t("plan")}</span>
                                        <strong className={`tier-text tier-${me?.tier || "free"}`}>{tierLabel}</strong>
                                    </div>
                                </div>
                                <div className="profile-divider" />
                                <button onClick={logout} className="profile-logout">
                                    <LogOut size={15} />
                                    {t("logout")}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Topbar>

            <main className="content">
                <div className="dash-hero">
                    <div className="dash-hero-text">
                        <h1>{t("dashTitle")}</h1>
                        <p>{t("dashSub")}</p>
                    </div>
                </div>

                <div className="dash-stats">
                    <motion.div className="stat-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <div className="stat-icon purple"><LayersIcon size={24} /></div>
                        <div className="stat-info">
                            <strong>{decks?.length ?? "–"}</strong>
                            <span>{t("statsSets")}</span>
                        </div>
                    </motion.div>
                    <motion.div className="stat-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="stat-icon cyan"><FolderIcon size={24} /></div>
                        <div className="stat-info">
                            <strong>{folders.length}</strong>
                            <span>{t("statsFolders")}</span>
                        </div>
                    </motion.div>
                    {isPro ? (
                        <motion.div className="stat-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <div className="stat-icon pink"><Flame size={24} /></div>
                            <div className="stat-info">
                                <strong>{stats ? stats.streak : "–"}</strong>
                                <span>{t("statsStreak")}</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ display: "contents" }}>
                            <Link to="/pricing" className="stat-card stat-locked">
                                <div className="stat-icon pink"><Lock size={22} /></div>
                                <div className="stat-info">
                                    <strong style={{ fontSize: "1rem" }}>{t("viewStats")}</strong>
                                    <span>{t("requiresPro")}</span>
                                </div>
                            </Link>
                        </motion.div>
                    )}
                </div>

                <div className="section-title">{t("folders")}</div>
                <div className="folder-shelf">
                    <button
                        className={`folder-card ${activeFolder === null ? "active" : ""}`}
                        onClick={() => setActiveFolder(null)}
                    >
                        <Folder open={activeFolder === null} color="#6366f1" />
                        <span className="folder-name">{t("allSets")}</span>
                        <span className="folder-count">{t("setsInFolder", { n: decks?.length ?? 0 })}</span>
                    </button>

                    {folders.map((folder, i) => (
                        <div key={folder.id} className={`folder-card ${activeFolder === folder.id ? "active" : ""}`}>
                            {renamingId === folder.id ? (
                                <div className="folder-rename">
                                    <input
                                        autoFocus
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") renameFolder(folder.id); if (e.key === "Escape") setRenamingId(null); }}
                                    />
                                    <button className="folder-mini-btn" onClick={() => renameFolder(folder.id)} aria-label={t("renameFolder")}><Check size={14} /></button>
                                    <button className="folder-mini-btn" onClick={() => setRenamingId(null)} aria-label={t("mmClose")}><X size={14} /></button>
                                </div>
                            ) : (
                                <>
                                    <button className="folder-hit" onClick={() => setActiveFolder(activeFolder === folder.id ? null : folder.id)}>
                                        <Folder open={activeFolder === folder.id} color={["#6366f1", "#f59e0b", "#06b6d4", "#10b981", "#ec4899", "#8b5cf6"][i % 6]} />
                                        <span className="folder-name">{folder.name}</span>
                                        <span className="folder-count">{t("setsInFolder", { n: folderCounts[folder.id] || 0 })}</span>
                                    </button>
                                    <div className="folder-actions">
                                        <button className="folder-mini-btn" onClick={() => { setRenamingId(folder.id); setRenameValue(folder.name); }} aria-label={t("renameFolder")}>
                                            <Pencil size={13} />
                                        </button>
                                        <button className="folder-mini-btn danger" onClick={() => deleteFolder(folder.id)} aria-label={t("deleteFolder")}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {creating ? (
                        <motion.div
                            className="folder-card folder-new-form"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="folder-form-head">
                                <span className="folder-form-icon"><FolderPlus size={16} /></span>
                                <span className="folder-form-title">{t("newFolder")}</span>
                                <button className="folder-mini-btn" onClick={() => { setCreating(false); setFolderName(""); }} aria-label={t("mmClose")}>
                                    <X size={13} />
                                </button>
                            </div>
                            <input
                                autoFocus
                                placeholder={t("folderNamePh")}
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") { setCreating(false); setFolderName(""); } }}
                            />
                            <button className="btn-primary folder-create-btn" onClick={createFolder} disabled={!folderName.trim()}>
                                <Check size={14} /> {t("createFolder")}
                            </button>
                        </motion.div>
                    ) : (
                        <button className="folder-card folder-new" onClick={() => setCreating(true)}>
                            <span className="folder-new-icon"><FolderPlus size={22} /></span>
                            <span className="folder-name">{t("newFolder")}</span>
                        </button>
                    )}
                </div>

                <div className="section-title">
                    {activeFolder === null ? t("allSets") : folders.find((f) => f.id === activeFolder)?.name}
                </div>

                {decks === null ? (
                    <DeckGridSkeleton />
                ) : visibleDecks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-illustration">
                            <Sparkles size={20} className="empty-spark s1" />
                            <div className="empty-cards">
                                <div className="empty-card-mock c1" />
                                <div className="empty-card-mock c2" />
                                <div className="empty-card-mock c3" />
                            </div>
                            <Sparkles size={14} className="empty-spark s2" />
                        </div>
                        <h3>{activeFolder === null ? t("noSets") : t("emptyFolder")}</h3>
                        <p>{t("firstSet")}</p>
                        <Link to="/new" className="btn-primary"><Plus size={16} /> {t("getStarted")}</Link>
                    </div>
                ) : (
                    <div className="deck-grid">
                        {visibleDecks.map((deck, i) => {
                            const meta = DECK_TYPES[deck.type] || DECK_TYPES.flashcards;
                            const TypeIcon = meta.icon;
                            return (
                                <motion.div
                                    key={deck.id}
                                    className="deck-card"
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className="deck-card-stripe" />
                                    <div className="deck-card-top">
                                        <span className="deck-card-iconchip" style={{ "--chip-color": meta.color }}>
                                            <TypeIcon size={22} />
                                        </span>
                                        <div className="deck-card-top-right">
                                            <span className="deck-type-badge">{t(meta.labelKey)}</span>
                                            <div className="deck-move-wrap">
                                                <button
                                                    className="deck-move-btn"
                                                    onClick={() => setMoveMenuId(moveMenuId === deck.id ? null : deck.id)}
                                                    title={t("moveToFolder")}
                                                    aria-label={t("moveToFolder")}
                                                >
                                                    <FolderInput size={15} />
                                                </button>
                                                <AnimatePresence>
                                                    {moveMenuId === deck.id && (
                                                        <motion.div
                                                            className="move-menu"
                                                            initial={{ opacity: 0, y: -4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -4 }}
                                                            transition={{ duration: 0.13 }}
                                                        >
                                                            <button className={`move-item ${!deck.folder_id ? "active" : ""}`} onClick={() => moveDeck(deck.id, null)}>
                                                                {t("noFolder")}
                                                            </button>
                                                            {folders.map((f) => (
                                                                <button key={f.id} className={`move-item ${deck.folder_id === f.id ? "active" : ""}`} onClick={() => moveDeck(deck.id, f.id)}>
                                                                    <FolderIcon size={13} /> {f.name}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                    <h3>{deck.title}</h3>
                                    <p className="deck-card-date">
                                        {new Date(deck.created_at).toLocaleDateString(lang === "en" ? "en-GB" : "nb-NO", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                    <div className="deck-actions">
                                        <Link to={deckRoute(deck.type, deck.id)} className="btn-primary">{t(actionKey[deck.type] || "actionMindmap")}</Link>
                                        <button onClick={() => deleteDeck(deck.id)} className="btn-danger">{t("delete")}</button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
