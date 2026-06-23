import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import api from "../api";
import { DECK_TYPES, deckRoute } from "../deckTypes";
import { useLang } from "../i18n";

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
    const [decks, setDecks] = useState([]);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const navigate = useNavigate();
    const email = getEmail();

    useEffect(() => {
        api.get("/flashcards/decks").then((res) => setDecks(res.data));
    }, []);

    useEffect(() => {
        function handleClick(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function deleteDeck(id) {
        await api.delete(`/flashcards/decks/${id}`);
        setDecks(decks.filter((d) => d.id !== id));
    }

    function logout() {
        localStorage.removeItem("token");
        navigate("/login");
    }

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <Logo className="topbar-logo-icon" />
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <div className="topbar-actions">
                    <Link to="/new" className="btn-primary">{t("newSet")}</Link>
                    <Link to="/settings" className="topbar-icon-btn" title={t("settingsTitle")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </Link>
                    <div className="profile-wrap" ref={profileRef}>
                        <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                            <span className="profile-avatar">{getInitial(email)}</span>
                        </button>
                        {profileOpen && (
                            <div className="profile-dropdown">
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
                                        <strong>{decks.length}</strong>
                                    </div>
                                    <div className="profile-meta-row">
                                        <span>{t("plan")}</span>
                                        <strong>{t("free")}</strong>
                                    </div>
                                </div>
                                <div className="profile-divider" />
                                <button onClick={logout} className="profile-logout">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                        <polyline points="16 17 21 12 16 7"/>
                                        <line x1="21" y1="12" x2="9" y2="12"/>
                                    </svg>
                                    {t("logout")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="content">
                <div className="dash-hero">
                    <div className="dash-hero-text">
                        <h1>{t("dashTitle")}</h1>
                        <p>{t("dashSub")}</p>
                    </div>
                </div>

                <div className="section-title">{t("allSets")}</div>

                {decks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>{t("noSets")}</h3>
                        <p>{t("firstSet")}</p>
                        <Link to="/new" className="btn-primary">{t("getStarted")}</Link>
                    </div>
                ) : (
                    <div className="deck-grid">
                        {decks.map((deck, i) => {
                            const meta = DECK_TYPES[deck.type] || DECK_TYPES.flashcards;
                            return (
                                <div key={deck.id} className="deck-card" style={{ animationDelay: `${i * 0.06}s` }}>
                                    <div className="deck-card-stripe" />
                                    <div className="deck-card-top">
                                        <span className="deck-card-icon">{meta.icon}</span>
                                        <span className="deck-type-badge">{t(meta.labelKey)}</span>
                                    </div>
                                    <h3>{deck.title}</h3>
                                    <p className="deck-card-date">
                                        {new Date(deck.created_at).toLocaleDateString(lang === "en" ? "en-GB" : "nb-NO", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                    <div className="deck-actions">
                                        <Link to={deckRoute(deck.type, deck.id)} className="btn-primary">{t(actionKey[deck.type] || "actionMindmap")}</Link>
                                        <button onClick={() => deleteDeck(deck.id)} className="btn-danger">{t("delete")}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
