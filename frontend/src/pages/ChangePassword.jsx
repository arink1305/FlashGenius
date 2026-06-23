import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import api from "../api";
import { useLang } from "../i18n";

export default function ChangePassword() {
    const { t } = useLang();
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.put("/auth/password", { current_password: currentPw, new_password: newPw });
            navigate("/settings");
        } catch {
            setError(t("cpError"));
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-left-content">
                    <span className="auth-left-icon">🔒</span>
                    <h2>{t("cpLeftTitle")}</h2>
                    <p>{t("cpLeftSub")}</p>
                </div>
                <div className="auth-features">
                    <div className="auth-feature"><span className="auth-feature-icon">✅</span> {t("cpFeat1")}</div>
                    <div className="auth-feature"><span className="auth-feature-icon">🔐</span> {t("cpFeat2")}</div>
                    <div className="auth-feature"><span className="auth-feature-icon">↩️</span> {t("cpFeat3")}</div>
                </div>
            </div>
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-logo">
                        <Logo className="auth-logo-icon" />
                        <span className="auth-logo-name">FlashGenius</span>
                    </div>
                    <h2 className="auth-title">{t("cpTitle")}</h2>
                    <p className="auth-subtitle">{t("cpSubtitle")}</p>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input
                            type="password"
                            placeholder={t("cpCurrentPh")}
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder={t("cpNewPh")}
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            minLength={6}
                            required
                        />
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? t("cpSaving") : t("cpSave")}
                        </button>
                    </form>
                    <p className="auth-link"><Link to="/settings">{t("cpBack")}</Link></p>
                </div>
            </div>
        </div>
    );
}
