import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import api from "../api";
import { useLang } from "../i18n";

export default function Login() {
    const { t } = useLang();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            navigate("/");
        } catch {
            setError(t("loginError"));
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-left-content">
                    <span className="auth-left-icon">⚡</span>
                    <h2>{t("loginLeftTitle")}</h2>
                    <p>{t("loginLeftSub")}</p>
                </div>
                <div className="auth-features">
                    <div className="auth-feature"><span className="auth-feature-icon">🧠</span> {t("authFeat1")}</div>
                    <div className="auth-feature"><span className="auth-feature-icon">⚙️</span> {t("authFeat2")}</div>
                    <div className="auth-feature"><span className="auth-feature-icon">📊</span> {t("authFeat3")}</div>
                </div>
            </div>
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-logo">
                        <Logo className="auth-logo-icon" />
                        <span className="auth-logo-name">FlashGenius</span>
                    </div>
                    <h2 className="auth-title">{t("welcomeBack")}</h2>
                    <p className="auth-subtitle">{t("loginSubtitle")}</p>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input type="email" placeholder={t("emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder={t("passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? t("loggingIn") : t("loginBtn")}
                        </button>
                    </form>
                    <p className="auth-link">{t("noAccount")} <Link to="/register">{t("registerLink")}</Link></p>
                </div>
            </div>
        </div>
    );
}
