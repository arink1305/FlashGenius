import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const difficulties = [
    { value: "easy", label: "Enkel", desc: "Korte, direkte svar", emoji: "🟢" },
    { value: "medium", label: "Medium", desc: "Forklaring inkludert", emoji: "🟡" },
    { value: "hard", label: "Vanskelig", desc: "Dype, detaljerte svar", emoji: "🔴" },
];

export default function Generate() {
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [count, setCount] = useState(8);
    const [difficulty, setDifficulty] = useState("medium");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/flashcards/generate", { title, notes, count, difficulty });
            navigate(`/study/${res.data.deck_id}`);
        } catch {
            setError("Noe gikk galt. Prøv igjen.");
            setLoading(false);
        }
    }

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
                <div className="page-header">
                    <h1>Generer flashcards ✨</h1>
                    <p>Lim inn notatene dine og velg innstillinger.</p>
                </div>

                <div className="generate-layout">
                    <form onSubmit={handleSubmit} className="generate-form">
                        <label className="form-label">
                            Tittel på settet
                            <input
                                type="text"
                                placeholder="F.eks. Kapittel 3 — Fotosyntese"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label className="form-label">
                            Notater
                            <textarea
                                placeholder="Lim inn notatene dine her. Jo mer innhold, desto bedre flashcards."
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
                                    Genererer {count} kort...
                                </span>
                            ) : `✨ Generer ${count} flashcards`}
                        </button>
                    </form>

                    <div className="generate-sidebar">
                        <div className="sidebar-card">
                            <h3>Antall kort</h3>
                            <div className="count-selector">
                                {[5, 8, 10, 15, 20].map((n) => (
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

                        <div className="generate-tip">
                            <strong>💡 Tips</strong>
                            Jo mer detaljerte notater du limer inn, desto bedre og mer presise flashcards får du.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
