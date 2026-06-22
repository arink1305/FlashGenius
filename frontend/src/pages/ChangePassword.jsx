import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function ChangePassword() {
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
            setError("Feil nåværende passord");
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-left-content">
                    <span className="auth-left-icon">🔒</span>
                    <h2>Endre passord</h2>
                    <p>Velg et nytt, sterkt passord for å holde kontoen din trygg.</p>
                </div>
                <div className="auth-features">
                    <div className="auth-feature"><span className="auth-feature-icon">✅</span> Minst 6 tegn</div>
                    <div className="auth-feature"><span className="auth-feature-icon">🔐</span> Passordet lagres kryptert</div>
                    <div className="auth-feature"><span className="auth-feature-icon">↩️</span> Du logges ikke ut etter endring</div>
                </div>
            </div>
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">⚡</div>
                        <span className="auth-logo-name">FlashGenius</span>
                    </div>
                    <h2 className="auth-title">Nytt passord</h2>
                    <p className="auth-subtitle">Fyll inn nåværende og nytt passord</p>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input
                            type="password"
                            placeholder="Nåværende passord"
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Nytt passord (minst 6 tegn)"
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            minLength={6}
                            required
                        />
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Lagrer..." : "Lagre nytt passord"}
                        </button>
                    </form>
                    <p className="auth-link"><Link to="/settings">← Tilbake til innstillinger</Link></p>
                </div>
            </div>
        </div>
    );
}
