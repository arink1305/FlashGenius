import { useState, useRef } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import api from "../api";
import Logo from "../components/Logo";
import { DECK_TYPES, deckRoute } from "../deckTypes";
import { useLang } from "../i18n";
import { extractText } from "../fileText";

const MAX_CHARS = 6000;

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
    const fileRef = useRef(null);

    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [count, setCount] = useState(type === "quiz" ? 6 : 8);
    const [difficulty, setDifficulty] = useState("medium");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fileLoading, setFileLoading] = useState(false);
    const [fileError, setFileError] = useState("");

    if (!DECK_TYPES[type]) return <Navigate to="/new" />;
    const meta = DECK_TYPES[type];

    const difficulties = [
        { value: "easy", label: t("diffEasyLabel"), desc: t("diffEasyDesc"), emoji: "🟢" },
        { value: "medium", label: t("diffMediumLabel"), desc: t("diffMediumDesc"), emoji: "🟡" },
        { value: "hard", label: t("diffHardLabel"), desc: t("diffHardDesc"), emoji: "🔴" },
    ];

    const tooLong = notes.length > MAX_CHARS;

    async function handleFile(e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setFileError("");
        setError("");
        setFileLoading(true);
        try {
            const text = await extractText(file);
            setNotes(text);
        } catch (err) {
            setFileError(err.message === "unsupported" ? t("fileUnsupported") : t("fileReadError"));
        } finally {
            setFileLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (tooLong) return;
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
                    <Logo className="topbar-logo-icon" />
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

                        <div className="form-label">
                            <div className="notes-label-row">
                                <span>{t("notesLabel")}</span>
                                <button type="button" className="upload-btn" onClick={() => fileRef.current?.click()} disabled={fileLoading}>
                                    {fileLoading ? (
                                        <><span className="spinner spinner-dark" /> {t("readingFile")}</>
                                    ) : (
                                        <>📎 {t("uploadFile")}</>
                                    )}
                                </button>
                                <input ref={fileRef} type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" hidden onChange={handleFile} />
                            </div>
                            <textarea
                                placeholder={t("notesPlaceholder")}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={14}
                                required
                            />
                            <div className="notes-meta">
                                <span className="upload-hint">{t("uploadHint")}</span>
                                <span className={`char-count ${tooLong ? "over" : ""}`}>{t("charCount", { n: notes.length, max: MAX_CHARS })}</span>
                            </div>
                        </div>

                        {fileError && <p className="error">{fileError}</p>}
                        {tooLong && <p className="error">{t("tooLong", { max: MAX_CHARS })}</p>}
                        {error && <p className="error">{error}</p>}

                        <button type="submit" className="btn-primary generate-submit" disabled={loading || fileLoading || tooLong}>
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
