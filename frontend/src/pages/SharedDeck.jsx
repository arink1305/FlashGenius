import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, ArrowRight } from "lucide-react";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { ViewerSkeleton } from "../components/Skeleton";
import api from "../api";
import { useLang } from "../i18n";

function MiniTree({ node, depth = 0 }) {
    return (
        <li className="shared-mm-item" style={{ "--depth": depth }}>
            <span className="shared-mm-title">{node.title}</span>
            {node.children?.length > 0 && (
                <ul className="shared-mm-list">
                    {node.children.map((child, i) => (
                        <MiniTree key={i} node={child} depth={depth + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

function SharedCard({ card, index }) {
    const { t } = useLang();
    const [flipped, setFlipped] = useState(false);
    return (
        <motion.button
            className={`shared-flashcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped(!flipped)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4) }}
        >
            <span className="card-label">{flipped ? t("answer") : t("question")}</span>
            <p>{flipped ? card.answer : card.question}</p>
        </motion.button>
    );
}

export default function SharedDeck() {
    const { shareToken } = useParams();
    const { t } = useLang();
    const [deck, setDeck] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        api.get(`/flashcards/shared/${shareToken}`)
            .then((res) => setDeck(res.data))
            .catch(() => setNotFound(true));
    }, [shareToken]);

    return (
        <div className="page">
            <Topbar>
                <Link to="/register" className="btn-primary">{t("navStart")}</Link>
            </Topbar>

            <main className="content">
                {notFound ? (
                    <div className="locked-state">
                        <div className="locked-icon"><Globe size={28} /></div>
                        <h3>{t("sharedNotFound")}</h3>
                        <Link to="/" className="btn-primary">FlashGenius <ArrowRight size={15} /></Link>
                    </div>
                ) : !deck ? (
                    <ViewerSkeleton />
                ) : (
                    <>
                        <div className="study-hero">
                            <div className="study-hero-text">
                                <h1>{deck.title}</h1>
                                <p><Globe size={13} style={{ marginRight: 5, verticalAlign: "-2px" }} />{t("sharedBadge")}</p>
                            </div>
                            <Link to="/register" className="btn-white-outline">{t("sharedCta")}</Link>
                        </div>

                        {deck.type === "flashcards" && (
                            <div className="shared-grid">
                                {deck.flashcards.map((card, i) => (
                                    <SharedCard key={i} card={card} index={i} />
                                ))}
                            </div>
                        )}

                        {deck.type === "quiz" && (
                            <div className="shared-quiz">
                                {(deck.content || []).map((q, i) => (
                                    <div key={i} className="quiz-card" style={{ margin: "0 0 16px" }}>
                                        <p className="quiz-question">{q.question}</p>
                                        <div className="quiz-options">
                                            {(q.options || []).map((option, j) => (
                                                <div key={j} className={`quiz-option ${option === q.answer ? "correct" : ""}`} style={{ cursor: "default" }}>
                                                    <span className="quiz-option-letter">{String.fromCharCode(65 + j)}</span>
                                                    <span>{option}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {deck.type === "summary" && (
                            <div className="summary-layout">
                                <div className="summary-main">
                                    <h2 className="summary-section-title">{t("summarySection")}</h2>
                                    {((deck.content || {}).summary || "").split("\n").filter(Boolean).map((para, i) => (
                                        <p key={i} className="summary-paragraph">{para}</p>
                                    ))}
                                </div>
                                {((deck.content || {}).key_points || []).length > 0 && (
                                    <div className="summary-points">
                                        <h2 className="summary-section-title">{t("keyPoints")}</h2>
                                        <ul className="key-points">
                                            {(deck.content.key_points || []).map((point, i) => (
                                                <li key={i}>
                                                    <span className="key-point-num">{i + 1}</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {deck.type === "mindmap" && deck.content && (
                            <div className="summary-main">
                                <ul className="shared-mm-list root">
                                    <MiniTree node={deck.content} />
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
