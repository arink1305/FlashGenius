import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function Quiz() {
    const { deckId } = useParams();
    const [deck, setDeck] = useState(null);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        api.get(`/flashcards/decks/${deckId}`).then((res) => setDeck(res.data));
    }, [deckId]);

    if (!deck) {
        return (
            <div className="page">
                <div className="content study-content">
                    <div style={{ fontSize: "2rem", marginTop: "80px" }}>⏳</div>
                </div>
            </div>
        );
    }

    const questions = deck.content || [];
    const total = questions.length;
    const q = questions[index];
    const progress = ((index + (selected !== null ? 1 : 0)) / total) * 100;

    function choose(option) {
        if (selected !== null) return;
        setSelected(option);
        if (option === q.answer) setScore((s) => s + 1);
    }

    function next() {
        if (index === total - 1) { setDone(true); return; }
        setSelected(null);
        setIndex((i) => i + 1);
    }

    function restart() {
        setIndex(0);
        setSelected(null);
        setScore(0);
        setDone(false);
    }

    function optionClass(option) {
        if (selected === null) return "quiz-option";
        if (option === q.answer) return "quiz-option correct";
        if (option === selected) return "quiz-option wrong";
        return "quiz-option dimmed";
    }

    const pct = total ? Math.round((score / total) * 100) : 0;

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/" className="btn-ghost">← Tilbake</Link>
            </header>

            <main className="content study-content">
                {done ? (
                    <div className="study-complete">
                        <div className="complete-icon">{pct >= 80 ? "🏆" : pct >= 50 ? "🎉" : "💪"}</div>
                        <div className="complete-badge">RESULTAT</div>
                        <h2>{score} av {total} riktig</h2>
                        <p>Du fikk <strong>{pct}%</strong> på «{deck.title}».</p>
                        <div className="study-nav" style={{ marginTop: "8px" }}>
                            <button onClick={restart} className="btn-primary">🔄 Prøv igjen</button>
                            <Link to="/" className="btn-ghost">← Tilbake til oversikten</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="study-hero">
                            <div className="study-hero-text">
                                <h1>{deck.title}</h1>
                                <p>Velg riktig svar</p>
                            </div>
                            <div className="quiz-score">Poeng: {score}</div>
                        </div>

                        <div className="progress-wrap">
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="progress-meta">
                                <span>Spørsmål {index + 1} av {total}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <div className="quiz-card">
                            <span className="card-label">Spørsmål</span>
                            <p className="quiz-question">{q.question}</p>
                            <div className="quiz-options">
                                {(q.options || []).map((option, i) => (
                                    <button key={i} className={optionClass(option)} onClick={() => choose(option)}>
                                        <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                                        <span>{option}</span>
                                        {selected !== null && option === q.answer && <span className="quiz-mark">✓</span>}
                                        {selected === option && option !== q.answer && <span className="quiz-mark">✕</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selected !== null && (
                            <div className="study-nav">
                                <button onClick={next} className="btn-primary">
                                    {index === total - 1 ? "Se resultat ✓" : "Neste →"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
