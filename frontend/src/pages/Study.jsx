import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, RefreshCw, ArrowLeft, ArrowRight, Check, MousePointerClick, Brain } from "lucide-react";
import Topbar from "../components/Topbar";
import ShareButton from "../components/ShareButton";
import { ViewerSkeleton } from "../components/Skeleton";
import api from "../api";
import { useLang } from "../i18n";
import { useMe, hasTier } from "../useMe";

export default function Study() {
    const { deckId } = useParams();
    const { t } = useLang();
    const me = useMe();
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
                <Topbar>
                    <Link to="/" className="btn-ghost">{t("back")}</Link>
                </Topbar>
                <main className="content"><ViewerSkeleton /></main>
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
            <Topbar>
                <ShareButton deckId={deckId} />
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </Topbar>

            <main className="content study-content">
                {done ? (
                    <motion.div className="study-complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                        <div className="complete-icon-wrap"><PartyPopper size={52} /></div>
                        <div className="complete-badge">{t("completed")}</div>
                        <h2>{t("wellDone")}</h2>
                        <p>{t("studyDoneText", { n: total })}</p>
                        <div className="study-nav" style={{ marginTop: "8px" }}>
                            <button onClick={restart} className="btn-primary"><RefreshCw size={15} /> {t("againRound")}</button>
                            <Link to="/" className="btn-ghost"><ArrowLeft size={15} /> {t("backToOverview")}</Link>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <div className="study-hero">
                            <div className="study-hero-text">
                                <h1>{deck.title}</h1>
                                <p>{t("studySub")}</p>
                            </div>
                            <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 1 }}>
                                {hasTier(me, "pro") && (
                                    <Link to={`/smart/${deckId}`} className="btn-white-outline">
                                        <Brain size={15} /> {t("smartMode")}
                                    </Link>
                                )}
                                <Link to="/" className="btn-white-outline">{t("exit")}</Link>
                            </div>
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

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                style={{ width: "100%", display: "flex", justifyContent: "center" }}
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
                            </motion.div>
                        </AnimatePresence>

                        <p className="flip-hint"><MousePointerClick size={14} /> {t("flipHint")}</p>

                        <div className="study-nav">
                            <button onClick={prev} disabled={index === 0} className="btn-ghost"><ArrowLeft size={15} /> {t("prev")}</button>
                            <button onClick={next} className="btn-primary">
                                {index === total - 1 ? <>{t("finish")} <Check size={15} /></> : <>{t("next")} <ArrowRight size={15} /></>}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
