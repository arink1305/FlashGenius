import { useState } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import api from "../api";
import { DECK_TYPES, deckRoute } from "../deckTypes";

const difficulties = [
    { value: "easy", label: "Enkel", desc: "Korte, direkte svar", emoji: "🟢" },
    { value: "medium", label: "Medium", desc: "Forklaring inkludert", emoji: "🟡" },
    { value: "hard", label: "Vanskelig", desc: "Dype, detaljerte svar", emoji: "🔴" },
];

const endpoints = {
    flashcards: "/flashcards/generate",
    quiz: "/flashcards/generate-quiz",
    summary: "/flashcards/generate-summary",
    mindmap: "/flashcards/generate-mindmap",
};

const titlePlaceholders = {
    flashcards: "F.eks. Kapittel 3 — Fotosyntese",
    quiz: "F.eks. Quiz — Den franske revolusjon",
    summary: "F.eks. Sammendrag — Cellebiologi",
    mindmap: "F.eks. Tankekart — Andre verdenskrig",
};

export default function Generate() {
    const { type } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [count, setCount] = useState(type === "quiz" ? 6 : 8);
    const [difficulty, setDifficulty] = useState("medium");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!DECK_TYPES[type]) return <Navigate to="/new" />;
    const meta = DECK_TYPES[type];

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
            setError("Noe gikk galt. Prøv igjen.");
            setLoading(false);
        }
    }

    const submitLabel = {
        flashcards: `✨ Generer ${count} flashcards`,
        quiz: `✨ Generer ${count} spørsmål`,
        summary: "✨ Lag sammendrag",
        mindmap: "✨ Lag tankekart",
    }[type];

    const hasSidebar = type === "flashcards" || type === "quiz";

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/new" className="btn-ghost">← Tilbake</Link>
            </header>

            <main className="content">
                <div className="page-header">
                    <h1>{meta.icon} {meta.label}</h1>
                    <p>Lim inn notatene dine{hasSidebar ? " og velg innstillinger" : ""} — AI-en gjør resten.</p>
                </div>

                <div className={hasSidebar ? "generate-layout" : "generate-layout single"}>
                    <form onSubmit={handleSubmit} className="generate-form">
                        <label className="form-label">
                            Tittel
                            <input
                                type="text"
                                placeholder={titlePlaceholders[type]}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label className="form-label">
                            Notater
                            <textarea
                                placeholder="Lim inn notatene dine her. Jo mer innhold, desto bedre resultat."
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
                                    Genererer...
                                </span>
                            ) : submitLabel}
                        </button>
                    </form>

                    {hasSidebar && (
                        <div className="generate-sidebar">
                            <div className="sidebar-card">
                                <h3>Antall {type === "quiz" ? "spørsmål" : "kort"}</h3>
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
                                    <h3>Vanskelighetsgrad</h3>
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
                                    <strong>🎲 Blandet quiz</strong>
                                    Du får en miks av flervalg (4 alternativer) og ja/nei-spørsmål automatisk.
                                </div>
                            )}

                            <div className="generate-tip">
                                <strong>💡 Tips</strong>
                                Jo mer detaljerte notater du limer inn, desto bedre og mer presist blir resultatet.
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
