import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { DECK_TYPES } from "../deckTypes";
import { useLang } from "../i18n";

const order = ["flashcards", "quiz", "summary", "mindmap"];

export default function NewSet() {
    const navigate = useNavigate();
    const { t } = useLang();

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <Logo className="topbar-logo-icon" />
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </header>

            <main className="content">
                <div className="page-header">
                    <h1>{t("newSetTitle")}</h1>
                </div>

                <div className="type-grid">
                    {order.map((key, i) => {
                        const meta = DECK_TYPES[key];
                        return (
                            <button
                                key={key}
                                className="type-card"
                                style={{ animationDelay: `${i * 0.06}s` }}
                                onClick={() => navigate(`/generate/${key}`)}
                            >
                                <div className="type-card-stripe" />
                                <span className="type-card-icon">{meta.icon}</span>
                                <h3>{t(meta.labelKey)}</h3>
                                <p>{t(meta.descKey)}</p>
                                <span className="type-card-go">{t("choose")}</span>
                            </button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
