import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useLang } from "../i18n";

export default function Study() {
    const { deckId } = useParams();
    const { t } = useLang();
    const [deck, setDeck] = useState(null);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
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

    const total = deck.flashcards.length;
    const card = deck.flashcards[index];
    const progress = ((index + 1) / total) * 100;

    function next() {
        if (index === total - 1) { setDone(true); return; }
        setFlipped(false);
        setTimeout(() => setIndex((i) => i + 1), 180);
    }

    function prev() {
        setFlipped(false);
        setTimeout(() => setIndex((i) => Math.max(i - 1, 0)), 180);
    }

    function restart() {
        setIndex(0);
        setFlipped(false);
        setDone(false);
    }

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </header>

            <main className="content study-content">
                {done ? (
                    <div className="study-complete">
                        <div className="complete-icon">🎉</div>
                        <div className="complete-badge">{t("completed")}</div>
                        <h2>{t("wellDone")}</h2>
                        <p>{t("studyDoneText", { n: total })}</p>
                        <div className="study-nav" style={{ marginTop: "8px" }}>
                            <button onClick={restart} className="btn-primary">{t("againRound")}</button>
                            <Link to="/" className="btn-ghost">{t("backToOverview")}</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="study-hero">
                            <div className="study-hero-text">
                                <h1>{deck.title}</h1>
                                <p>{t("studySub")}</p>
                            </div>
                            <Link to="/" className="btn-white-outline">{t("exit")}</Link>
                        </div>

                        <div className="progress-wrap">
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="progress-meta">
                                <span>{t("cardOf", { i: index + 1, n: total })}</span>
                                <span>{t("percentDone", { p: Math.round(progress) })}</span>
                            </div>
                        </div>

                        <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
                            <div className="flashcard-inner">
                                <div className="flashcard-front">
                                    <span className="card-label">{t("question")}</span>
                                    <p>{card.question}</p>
                                </div>
                                <div className="flashcard-back">
                                    <span className="card-label">{t("answer")}</span>
                                    <p>{card.answer}</p>
                                </div>
                            </div>
                        </div>

                        <p className="flip-hint">{t("flipHint")}</p>

                        <div className="study-nav">
                            <button onClick={prev} disabled={index === 0} className="btn-ghost">{t("prev")}</button>
                            <button onClick={next} className="btn-primary">
                                {index === total - 1 ? t("finish") : t("next")}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
