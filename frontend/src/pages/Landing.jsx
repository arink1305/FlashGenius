import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export default function Landing() {
    const { t } = useLang();
    const features = [
        { icon: "⚡", title: t("feat1Title"), desc: t("feat1Desc") },
        { icon: "🎯", title: t("feat2Title"), desc: t("feat2Desc") },
        { icon: "🧠", title: t("feat3Title"), desc: t("feat3Desc") },
        { icon: "📊", title: t("feat4Title"), desc: t("feat4Desc") },
    ];

    return (
        <div className="landing">
            <header className="topbar">
                <div className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </div>
                <div className="topbar-actions">
                    <Link to="/login" className="btn-ghost">{t("navLogin")}</Link>
                    <Link to="/register" className="btn-primary">{t("navStart")}</Link>
                </div>
            </header>

            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <div className="landing-badge">{t("heroBadge")}</div>
                    <h1 className="landing-title">
                        {t("heroTitle1")}<br />
                        <span className="landing-title-grad">{t("heroTitle2")}</span>
                    </h1>
                    <p className="landing-sub">{t("heroSub")}</p>
                    <div className="landing-ctas">
                        <Link to="/register" className="btn-primary landing-cta-main">{t("ctaCreate")}</Link>
                        <Link to="/login" className="btn-ghost">{t("navLogin")}</Link>
                    </div>
                </div>
                <div className="landing-hero-card">
                    <div className="landing-card-mock">
                        <div className="mock-label">{t("mockLabel")}</div>
                        <p className="mock-question">{t("mockQuestion")}</p>
                        <div className="mock-flip">{t("mockFlip")}</div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-features-inner">
                    <h2 className="landing-section-title">{t("featuresTitle")}</h2>
                    <div className="landing-feature-grid">
                        {features.map((f) => (
                            <div key={f.title} className="landing-feature-card">
                                <div className="landing-feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="landing-cta-section">
                <h2>{t("ctaSectionTitle")}</h2>
                <p>{t("ctaSectionSub")}</p>
                <Link to="/register" className="btn-primary landing-cta-main">{t("ctaSectionBtn")}</Link>
            </section>
        </div>
    );
}
