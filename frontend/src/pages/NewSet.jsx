import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { DECK_TYPES } from "../deckTypes";
import { useLang } from "../i18n";
import { useMe, hasTier } from "../useMe";

const order = ["flashcards", "quiz", "summary", "mindmap"];

export default function NewSet() {
    const navigate = useNavigate();
    const { t } = useLang();
    const me = useMe();

    return (
        <div className="page">
            <Topbar>
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </Topbar>

            <main className="content">
                <div className="page-header">
                    <h1>{t("newSetTitle")}</h1>
                </div>

                <div className="type-grid">
                    {order.map((key, i) => {
                        const meta = DECK_TYPES[key];
                        const Icon = meta.icon;
                        const isLocked = meta.minTier && !hasTier(me, meta.minTier);
                        return (
                            <motion.button
                                key={key}
                                className={`type-card ${isLocked ? "locked" : ""}`}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                onClick={() => navigate(isLocked ? "/pricing" : `/generate/${key}`)}
                            >
                                <div className="type-card-stripe" style={{ background: meta.grad }} />
                                <div className="type-card-top">
                                    <span className="type-card-iconchip" style={{ "--chip-color": meta.color }}>
                                        <Icon size={26} />
                                    </span>
                                    {isLocked && (
                                        <span className="lock-badge">
                                            <Lock size={11} /> {t("requiresPlus")}
                                        </span>
                                    )}
                                </div>
                                <h3>{t(meta.labelKey)}</h3>
                                <p>{t(meta.descKey)}</p>
                                <span className="type-card-go">
                                    {isLocked ? t("seePlans") : t("choose")} <ArrowRight size={14} style={{ verticalAlign: "-2px" }} />
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </main>
            <Footer />
        </div>
    );
}
