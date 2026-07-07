import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Rocket, Sparkles, Target, Lock } from "lucide-react";
import Logo from "../components/Logo";
import api from "../api";
import { useLang } from "../i18n";

export default function Register() {
    const { t } = useLang();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (password !== confirm) {
            setError(t("passwordsMismatch"));
            return;
        }
        setLoading(true);
        try {
            const res = await api.post("/auth/register", { email, password });
            localStorage.setItem("token", res.data.token);
            navigate("/");
        } catch {
            setError(t("emailTaken"));
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-left-content">
                    <span className="auth-left-icon"><Rocket size={46} /></span>
                    <h2>{t("registerLeftTitle")}</h2>
                    <p>{t("registerLeftSub")}</p>
                </div>
                <div className="auth-features">
                    <div className="auth-feature"><span className="auth-feature-icon"><Sparkles size={17} /></span> {t("regFeat1")}</div>
                    <div className="auth-feature"><span className="auth-feature-icon"><Target size={17} /></span> {t("regFeat2")}</div>
                    <div className="auth-feature"><span className="auth-feature-icon"><Lock size={17} /></span> {t("regFeat3")}</div>
                </div>
            </div>
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-logo">
                        <Logo className="auth-logo-icon" />
                        <span className="auth-logo-name">FlashGenius</span>
                    </div>
                    <h2 className="auth-title">{t("createAccount")}</h2>
                    <p className="auth-subtitle">{t("createSubtitle")}</p>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input type="email" placeholder={t("emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder={t("passwordHint")} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                        <input type="password" placeholder={t("confirmPassword")} value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? t("creatingAccount") : t("createAccount")}
                        </button>
                    </form>
                    <p className="auth-link">{t("haveAccount")} <Link to="/login">{t("loginBtn")}</Link></p>
                </div>
            </div>
        </div>
    );
}
