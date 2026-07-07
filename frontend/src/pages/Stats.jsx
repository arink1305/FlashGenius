import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Lock, Layers } from "lucide-react";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { ViewerSkeleton } from "../components/Skeleton";
import api from "../api";
import { useLang } from "../i18n";

export default function Stats() {
    const { t, lang } = useLang();
    const [stats, setStats] = useState(null);
    const [locked, setLocked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/flashcards/stats")
            .then((res) => setStats(res.data))
            .catch((err) => {
                if (err.response?.status === 403) setLocked(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const dayName = (dateStr) => {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString(lang === "en" ? "en-GB" : "nb-NO", { weekday: "short" });
    };

    const maxCount = stats ? Math.max(...stats.week.map((d) => d.count), 1) : 1;

    return (
        <div className="page">
            <Topbar>
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </Topbar>

            <main className="content">
                <div className="page-header">
                    <h1>{t("statsTitle")}</h1>
                    <p>{t("statsSub")}</p>
                </div>

                {loading ? (
                    <ViewerSkeleton />
                ) : locked ? (
                    <div className="locked-state">
                        <div className="locked-icon"><Lock size={28} /></div>
                        <h3>{t("statsLockedTitle")}</h3>
                        <p>{t("statsLockedDesc")}</p>
                        <Link to="/pricing" className="btn-primary">{t("seePlans")}</Link>
                    </div>
                ) : stats ? (
                    <>
                        <div className="dash-stats">
                            <motion.div className="stat-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="stat-icon pink"><Flame size={24} /></div>
                                <div className="stat-info">
                                    <strong>{stats.streak}</strong>
                                    <span>{t("statsStreakUnit", { n: stats.streak }).replace(/^\d+\s*/, "")}</span>
                                </div>
                            </motion.div>
                            <motion.div className="stat-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                                <div className="stat-icon purple"><TrendingUp size={24} /></div>
                                <div className="stat-info">
                                    <strong>{stats.week_total}</strong>
                                    <span>{t("statsWeek")}</span>
                                </div>
                            </motion.div>
                            <motion.div className="stat-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                                <div className="stat-icon cyan"><Layers size={24} /></div>
                                <div className="stat-info">
                                    <strong>{stats.mastery.length}</strong>
                                    <span>{t("statsSets")}</span>
                                </div>
                            </motion.div>
                        </div>

                        <div className="stats-panels">
                            <div className="stats-panel">
                                <h3 className="summary-section-title">{t("statsWeekLabel")}</h3>
                                <div className="week-chart">
                                    {stats.week.map((day, i) => (
                                        <div key={day.day} className="week-col">
                                            <span className="week-value">{day.count > 0 ? day.count : ""}</span>
                                            <motion.div
                                                className="week-bar"
                                                initial={{ height: 4 }}
                                                animate={{ height: `${Math.max(6, (day.count / maxCount) * 120)}px` }}
                                                transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                            />
                                            <span className="week-day">{dayName(day.day)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="stats-panel">
                                <h3 className="summary-section-title">{t("statsMastery")}</h3>
                                {stats.mastery.length === 0 ? (
                                    <p className="stats-empty">{t("statsEmpty")}</p>
                                ) : (
                                    <div className="mastery-list">
                                        {stats.mastery.map((deck, i) => (
                                            <div key={deck.deck_id} className="mastery-row">
                                                <div className="mastery-head">
                                                    <Link to={`/smart/${deck.deck_id}`} className="mastery-title">{deck.title}</Link>
                                                    <span className="mastery-pct">{deck.pct}%</span>
                                                </div>
                                                <div className="mastery-track">
                                                    <motion.div
                                                        className="mastery-fill"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${deck.pct}%` }}
                                                        transition={{ delay: 0.2 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                                    />
                                                </div>
                                                <span className="mastery-sub">{t("statsLearned", { learned: deck.learned, total: deck.total })}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </main>
            <Footer />
        </div>
    );
}
