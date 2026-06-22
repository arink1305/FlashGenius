import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function Summary() {
    const { deckId } = useParams();
    const [deck, setDeck] = useState(null);

    useEffect(() => {
        api.get(`/flashcards/decks/${deckId}`).then((res) => setDeck(res.data));
    }, [deckId]);

    if (!deck) {
        return (
            <div className="page">
                <div className="content"><div style={{ fontSize: "2rem", marginTop: "80px", textAlign: "center" }}>⏳</div></div>
            </div>
        );
    }

    const content = deck.content || {};
    const keyPoints = content.key_points || [];

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
                        <h1>📝 {deck.title}</h1>
                        <p>AI-generert sammendrag</p>
                    </div>
                </div>

                <div className="summary-layout">
                    <div className="summary-main">
                        <h2 className="summary-section-title">Sammendrag</h2>
                        {(content.summary || "").split("\n").filter(Boolean).map((para, i) => (
                            <p key={i} className="summary-paragraph">{para}</p>
                        ))}
                    </div>

                    {keyPoints.length > 0 && (
                        <div className="summary-points">
                            <h2 className="summary-section-title">Nøkkelpunkter</h2>
                            <ul className="key-points">
                                {keyPoints.map((point, i) => (
                                    <li key={i}>
                                        <span className="key-point-num">{i + 1}</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
