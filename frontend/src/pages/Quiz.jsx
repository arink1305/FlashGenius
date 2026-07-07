import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, PartyPopper, Dumbbell, RefreshCw, ArrowLeft, Check, X, ArrowRight } from "lucide-react";
import Topbar from "../components/Topbar";
import ShareButton from "../components/ShareButton";
import { ViewerSkeleton } from "../components/Skeleton";
import api from "../api";
import { useLang } from "../i18n";

export default function Quiz() {
    const { deckId } = useParams();
    const { t } = useLang();
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
                <Topbar>
                    <Link to="/" className="btn-ghost">{t("back")}</Link>
                </Topbar>
                <main className="content"><ViewerSkeleton /></main>
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
    const ResultIcon = pct >= 80 ? Trophy : pct >= 50 ? PartyPopper : Dumbbell;

    return (
        <div className="page">
            <Topbar>
                <ShareButton deckId={deckId} />
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </Topbar>

            <main className="content study-content">
                {done ? (
                    <motion.div className="study-complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                        <div className="complete-icon-wrap"><ResultIcon size={52} /></div>
                        <div className="complete-badge">{t("result")}</div>
                        <h2>{t("correctOf", { score, total })}</h2>
                        <p>{t("quizResultText", { pct })}</p>
                        <div className="study-nav" style={{ marginTop: "8px" }}>
                            <button onClick={restart} className="btn-primary"><RefreshCw size={15} /> {t("tryAgain")}</button>
                            <Link to="/" className="btn-ghost"><ArrowLeft size={15} /> {t("backToOverview")}</Link>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <div className="study-hero">
                            <div className="study-hero-text">
                                <h1>{deck.title}</h1>
                                <p>{t("quizSub")}</p>
                            </div>
                            <div className="quiz-score">{t("score", { n: score })}</div>
                        </div>

                        <div className="progress-wrap">
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="progress-meta">
                                <span>{t("questionOf", { i: index + 1, n: total })}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                className="quiz-card"
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <span className="card-label">{t("question")}</span>
                                <p className="quiz-question">{q.question}</p>
                                <div className="quiz-options">
                                    {(q.options || []).map((option, i) => (
                                        <button key={i} className={optionClass(option)} onClick={() => choose(option)}>
                                            <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                                            <span>{option}</span>
                                            {selected !== null && option === q.answer && <span className="quiz-mark"><Check size={17} /></span>}
                                            {selected === option && option !== q.answer && <span className="quiz-mark"><X size={17} /></span>}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {selected !== null && (
                            <motion.div className="study-nav" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                <button onClick={next} className="btn-primary">
                                    {index === total - 1 ? <>{t("seeResult")} <Check size={15} /></> : <>{t("next")} <ArrowRight size={15} /></>}
                                </button>
                            </motion.div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
