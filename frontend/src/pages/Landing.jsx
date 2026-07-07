import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Target, Brain, FolderOpen, Sparkles, ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import { useLang } from "../i18n";

export default function Landing() {
    const { t } = useLang();
    const features = [
        { icon: Zap, title: t("feat1Title"), desc: t("feat1Desc"), cls: "purple" },
        { icon: Target, title: t("feat2Title"), desc: t("feat2Desc"), cls: "warm" },
        { icon: Brain, title: t("feat3Title"), desc: t("feat3Desc"), cls: "cyan" },
        { icon: FolderOpen, title: t("feat4Title"), desc: t("feat4Desc"), cls: "green" },
    ];

    return (
        <div className="landing">
            <header className="topbar">
                <div className="topbar-logo">
                    <Logo className="topbar-logo-icon" />
                    <span className="topbar-logo-name">FlashGenius</span>
                </div>
                <div className="topbar-actions">
                    <Link to="/pricing" className="btn-ghost">{t("navPricing")}</Link>
                    <Link to="/login" className="btn-ghost">{t("navLogin")}</Link>
                    <Link to="/register" className="btn-primary">{t("navStart")}</Link>
                </div>
            </header>

            <section className="landing-hero">
                <motion.div
                    className="landing-hero-inner"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="landing-badge"><Sparkles size={14} /> {t("heroBadge")}</div>
                    <h1 className="landing-title">
                        {t("heroTitle1")}<br />
                        <span className="landing-title-grad">{t("heroTitle2")}</span>
                    </h1>
                    <p className="landing-sub">{t("heroSub")}</p>
                    <div className="landing-ctas">
                        <Link to="/register" className="btn-primary landing-cta-main">{t("ctaCreate")} <ArrowRight size={16} /></Link>
                        <Link to="/login" className="btn-ghost">{t("navLogin")}</Link>
                    </div>
                </motion.div>
                <motion.div
                    className="landing-hero-card"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="landing-card-mock">
                        <div className="mock-label">{t("mockLabel")}</div>
                        <p className="mock-question">{t("mockQuestion")}</p>
                        <div className="mock-flip">{t("mockFlip")}</div>
                    </div>
                </motion.div>
            </section>

            <section className="landing-features">
                <div className="landing-features-inner">
                    <h2 className="landing-section-title">{t("featuresTitle")}</h2>
                    <div className="landing-feature-grid">
                        {features.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <motion.div
                                    key={f.title}
                                    className="landing-feature-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className={`landing-feature-icon ${f.cls}`}><Icon size={22} /></div>
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="landing-cta-section">
                <h2>{t("ctaSectionTitle")}</h2>
                <p>{t("ctaSectionSub")}</p>
                <Link to="/register" className="btn-primary landing-cta-main">{t("ctaSectionBtn")} <ArrowRight size={16} /></Link>
            </section>

            <Footer />
        </div>
    );
}
