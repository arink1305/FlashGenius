import { Link } from "react-router-dom";

const features = [
    { icon: "⚡", title: "Lynrask generering", desc: "Lim inn notater og få flashcards på sekunder med AI." },
    { icon: "🎯", title: "Velg vanskelighetsgrad", desc: "Enkel, medium eller vanskelig — tilpass til ditt nivå." },
    { icon: "🧠", title: "Lær smartere", desc: "Kortbasert repetisjon som faktisk fungerer." },
    { icon: "📊", title: "Hold oversikt", desc: "Alle settene dine samlet på ett sted." },
];

export default function Landing() {
    return (
        <div className="landing">
            <header className="topbar">
                <div className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </div>
                <div className="topbar-actions">
                    <Link to="/login" className="btn-ghost">Logg inn</Link>
                    <Link to="/register" className="btn-primary">Kom i gang gratis</Link>
                </div>
            </header>

            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <div className="landing-badge">✨ Drevet av Groq AI</div>
                    <h1 className="landing-title">
                        Gjør notater om til<br />
                        <span className="landing-title-grad">flashcards på sekunder</span>
                    </h1>
                    <p className="landing-sub">
                        Lim inn tekstene dine og la AI-en lage perfekte studiekort. Velg antall kort og vanskelighetsgrad — resten ordner seg selv.
                    </p>
                    <div className="landing-ctas">
                        <Link to="/register" className="btn-primary landing-cta-main">Opprett gratis konto →</Link>
                        <Link to="/login" className="btn-ghost">Logg inn</Link>
                    </div>
                </div>
                <div className="landing-hero-card">
                    <div className="landing-card-mock">
                        <div className="mock-label">Spørsmål</div>
                        <p className="mock-question">Hva er fotosyntese?</p>
                        <div className="mock-flip">Klikk for å snu ↓</div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-features-inner">
                    <h2 className="landing-section-title">Alt du trenger for å lære</h2>
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
                <h2>Klar til å lære smartere?</h2>
                <p>Gratis — ingen kredittkort nødvendig.</p>
                <Link to="/register" className="btn-primary landing-cta-main">Kom i gang nå →</Link>
            </section>
        </div>
    );
}
