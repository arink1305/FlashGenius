import { useState } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import api from "../api";
import { DECK_TYPES, deckRoute } from "../deckTypes";
import { useLang } from "../i18n";

const endpoints = {
    flashcards: "/flashcards/generate",
    quiz: "/flashcards/generate-quiz",
    summary: "/flashcards/generate-summary",
    mindmap: "/flashcards/generate-mindmap",
};

export default function Generate() {
    const { type } = useParams();
    const navigate = useNavigate();
    const { t } = useLang();

    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [count, setCount] = useState(type === "quiz" ? 6 : 8);
    const [difficulty, setDifficulty] = useState("medium");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!DECK_TYPES[type]) return <Navigate to="/new" />;
    const meta = DECK_TYPES[type];

    const difficulties = [
        { value: "easy", label: t("diffEasyLabel"), desc: t("diffEasyDesc"), emoji: "🟢" },
        { value: "medium", label: t("diffMediumLabel"), desc: t("diffMediumDesc"), emoji: "🟡" },
        { value: "hard", label: t("diffHardLabel"), desc: t("diffHardDesc"), emoji: "🔴" },
    ];

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const payload = { title, notes };
        if (type === "flashcards") { payload.count = count; payload.difficulty = difficulty; }
        if (type === "quiz") { payload.count = count; }
        try {
            const res = await api.post(endpoints[type], payload);
            navigate(deckRoute(type, res.data.deck_id));
        } catch {
            setError(t("genError"));
            setLoading(false);
        }
    }

    const submitLabel = {
        flashcards: t("submitFlashcards", { n: count }),
        quiz: t("submitQuiz", { n: count }),
        summary: t("submitSummary"),
        mindmap: t("submitMindmap"),
    }[type];

    const hasSidebar = type === "flashcards" || type === "quiz";

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/new" className="btn-ghost">{t("back")}</Link>
            </header>

            <main className="content">
                <div className="page-header">
                    <h1>{meta.icon} {t(meta.labelKey)}</h1>
                    <p>{hasSidebar ? t("genSubSidebar") : t("genSubPlain")}</p>
                </div>

                <div className={hasSidebar ? "generate-layout" : "generate-layout single"}>
                    <form onSubmit={handleSubmit} className="generate-form">
                        <label className="form-label">
                            {t("titleLabel")}
                            <input
                                type="text"
                                placeholder={t(`titlePh_${type}`)}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label className="form-label">
                            {t("notesLabel")}
                            <textarea
                                placeholder={t("notesPlaceholder")}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={14}
                                required
                            />
                        </label>
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn-primary generate-submit" disabled={loading}>
                            {loading ? (
                                <span className="loading-text">
                                    <span className="spinner" />
                                    {t("generating")}
                                </span>
                            ) : submitLabel}
                        </button>
                    </form>

                    {hasSidebar && (
                        <div className="generate-sidebar">
                            <div className="sidebar-card">
                                <h3>{type === "quiz" ? t("countQuestions") : t("countCards")}</h3>
                                <div className="count-selector">
                                    {(type === "quiz" ? [5, 6, 8, 10, 12] : [5, 8, 10, 15, 20]).map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            className={`count-btn ${count === n ? "active" : ""}`}
                                            onClick={() => setCount(n)}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {type === "flashcards" && (
                                <div className="sidebar-card">
                                    <h3>{t("difficulty")}</h3>
                                    <div className="difficulty-selector">
                                        {difficulties.map((d) => (
                                            <button
                                                key={d.value}
                                                type="button"
                                                className={`difficulty-btn ${difficulty === d.value ? "active" : ""}`}
                                                onClick={() => setDifficulty(d.value)}
                                            >
                                                <span>{d.emoji}</span>
                                                <span className="difficulty-text">
                                                    <span className="difficulty-label">{d.label}</span>
                                                    <span className="difficulty-desc">{d.desc}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {type === "quiz" && (
                                <div className="generate-tip">
                                    <strong>{t("quizMixTitle")}</strong>
                                    {t("quizMixDesc")}
                                </div>
                            )}

                            <div className="generate-tip">
                                <strong>{t("tipTitle")}</strong>
                                {t("tipDesc")}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
