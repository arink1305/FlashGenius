import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import Topbar from "../components/Topbar";
import ShareButton from "../components/ShareButton";
import Footer from "../components/Footer";
import { ViewerSkeleton } from "../components/Skeleton";
import api from "../api";
import { useLang } from "../i18n";

export default function Summary() {
    const { deckId } = useParams();
    const { t } = useLang();
    const [deck, setDeck] = useState(null);

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

    const content = deck.content || {};
    const keyPoints = content.key_points || [];

    return (
        <div className="page">
            <Topbar>
                <ShareButton deckId={deckId} />
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </Topbar>

            <main className="content">
                <div className="study-hero">
                    <div className="study-hero-text">
                        <h1><FileText size={20} style={{ marginRight: 8, verticalAlign: "-3px" }} />{deck.title}</h1>
                        <p>{t("summaryHeroSub")}</p>
                    </div>
                </div>

                <div className="summary-layout">
                    <motion.div className="summary-main" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                        <h2 className="summary-section-title">{t("summarySection")}</h2>
                        {(content.summary || "").split("\n").filter(Boolean).map((para, i) => (
                            <p key={i} className="summary-paragraph">{para}</p>
                        ))}
                    </motion.div>

                    {keyPoints.length > 0 && (
                        <motion.div className="summary-points" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
                            <h2 className="summary-section-title">{t("keyPoints")}</h2>
                            <ul className="key-points">
                                {keyPoints.map((point, i) => (
                                    <li key={i}>
                                        <span className="key-point-num">{i + 1}</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
