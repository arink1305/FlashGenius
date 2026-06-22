import { Link, useNavigate } from "react-router-dom";
import { DECK_TYPES } from "../deckTypes";

const order = ["flashcards", "quiz", "summary", "mindmap"];

export default function NewSet() {
    const navigate = useNavigate();

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
                    <h1>Hva vil du lage? ✨</h1>
                    <p></p>
                </div>

                <div className="type-grid">
                    {order.map((key, i) => {
                        const t = DECK_TYPES[key];
                        return (
                            <button
                                key={key}
                                className="type-card"
                                style={{ animationDelay: `${i * 0.06}s` }}
                                onClick={() => navigate(`/generate/${key}`)}
                            >
                                <div className="type-card-stripe" />
                                <span className="type-card-icon">{t.icon}</span>
                                <h3>{t.label}</h3>
                                <p>{t.desc}</p>
                                <span className="type-card-go">Velg →</span>
                            </button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
