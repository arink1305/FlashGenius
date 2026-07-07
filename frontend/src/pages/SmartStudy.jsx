import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Brain, CheckCircle2, Clock } from "lucide-react";
import Topbar from "../components/Topbar";
import { ViewerSkeleton } from "../components/Skeleton";
import api from "../api";
import { useLang } from "../i18n";

const GRADES = [
    { quality: 1, key: "smartAgain", cls: "grade-again" },
    { quality: 3, key: "smartHard", cls: "grade-hard" },
    { quality: 4, key: "smartGood", cls: "grade-good" },
    { quality: 5, key: "smartEasy", cls: "grade-easy" },
];

export default function SmartStudy() {
    const { deckId } = useParams();
    const { t } = useLang();
    const [queue, setQueue] = useState(null);
    const [locked, setLocked] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [reviewed, setReviewed] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/flashcards/decks/${deckId}/due`)
            .then((res) => setQueue(res.data.due))
            .catch((err) => {
                if (err.response?.status === 403) setLocked(true);
            })
            .finally(() => setLoading(false));
    }, [deckId]);

    async function grade(quality) {
        const card = queue[0];
        setFlipped(false);
        setTimeout(() => {
            setQueue((q) => q.slice(1));
            setReviewed((n) => n + 1);
        }, 160);
        try {
            await api.post("/flashcards/review", { card_id: card.id, deck_id: Number(deckId), quality });
        } catch {
            return;
        }
    }

    if (loading) {
        return (
            <div className="page">
                <Topbar>
                    <Link to="/" className="btn-ghost">{t("back")}</Link>
                </Topbar>
                <main className="content"><ViewerSkeleton /></main>
            </div>
        );
    }

    if (locked) {
        return (
            <div className="page">
                <Topbar>
                    <Link to="/" className="btn-ghost">{t("back")}</Link>
                </Topbar>
                <main className="content">
                    <div className="locked-state">
                        <div className="locked-icon"><Lock size={28} /></div>
                        <h3>{t("smartLockedTitle")}</h3>
                        <p>{t("smartLockedDesc")}</p>
                        <Link to="/pricing" className="btn-primary">{t("seePlans")}</Link>
                    </div>
                </main>
            </div>
        );
    }

    const card = queue?.[0];

    return (
        <div className="page">
            <Topbar>
                <Link to="/" className="btn-ghost">{t("exit")}</Link>
            </Topbar>

            <main className="content study-content">
                {!card ? (
                    <div className="study-complete">
                        <div className="complete-icon-wrap">
                            {reviewed > 0 ? <CheckCircle2 size={52} /> : <Clock size={52} />}
                        </div>
                        <div className="complete-badge">{t("smartTitle")}</div>
                        <h2>{reviewed > 0 ? t("smartDone") : t("smartNothingDue")}</h2>
                        <p>{reviewed > 0 ? t("smartDoneText", { n: reviewed }) : t("smartNothingDueText")}</p>
                        <div className="study-nav" style={{ marginTop: "8px" }}>
                            <Link to="/" className="btn-primary">{t("backToOverview")}</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="study-hero">
                            <div className="study-hero-text">
                                <h1><Brain size={20} style={{ marginRight: 8, verticalAlign: "-3px" }} />{t("smartTitle")}</h1>
                                <p>{t("smartSub")}</p>
                            </div>
                            <div className="quiz-score">{t("smartCardsLeft", { n: queue.length })}</div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
                            >
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

                                {!flipped ? (
                                    <p className="flip-hint">{t("flipHint")}</p>
                                ) : (
                                    <div className="grade-section">
                                        <p className="grade-question">{t("smartHowWas")}</p>
                                        <div className="grade-row">
                                            {GRADES.map((g) => (
                                                <button key={g.quality} className={`grade-btn ${g.cls}`} onClick={() => grade(g.quality)}>
                                                    {t(g.key)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </>
                )}
            </main>
        </div>
    );
}
