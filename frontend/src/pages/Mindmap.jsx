import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function Mindmap() {
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
    const branches = content.branches || [];

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
                        <h1>🧠 {deck.title}</h1>
                        <p>Visuelt tankekart</p>
                    </div>
                </div>

                <div className="mindmap">
                    <div className="mindmap-central">{content.central || deck.title}</div>
                    <div className="mindmap-branches">
                        {branches.map((branch, i) => (
                            <div key={i} className="mindmap-branch" style={{ animationDelay: `${i * 0.07}s` }}>
                                <div className="mindmap-branch-head">{branch.title}</div>
                                <div className="mindmap-children">
                                    {(branch.children || []).map((child, j) => (
                                        <span key={j} className="mindmap-child">{child}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
