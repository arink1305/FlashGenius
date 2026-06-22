import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Register() {
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
            setError("Passordene er ikke like");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post("/auth/register", { email, password });
            localStorage.setItem("token", res.data.token);
            navigate("/");
        } catch {
            setError("E-posten er allerede registrert");
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-left-content">
                    <span className="auth-left-icon">🚀</span>
                    <h2>Kom i gang gratis</h2>
                    <p>Opprett en konto og begynn å lage AI-drevne flashcards på sekunder.</p>
                </div>
                <div className="auth-features">
                    <div className="auth-feature"><span className="auth-feature-icon">✨</span> Ubegrenset antall flashcard-sett</div>
                    <div className="auth-feature"><span className="auth-feature-icon">🎯</span> Tilpass vanskelighetsgrad</div>
                    <div className="auth-feature"><span className="auth-feature-icon">🔒</span> Sikkert og personlig</div>
                </div>
            </div>
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">⚡</div>
                        <span className="auth-logo-name">FlashGenius</span>
                    </div>
                    <h2 className="auth-title">Opprett konto</h2>
                    <p className="auth-subtitle">Gratis — ingen kredittkort nødvendig</p>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder="Passord (minst 6 tegn)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                        <input type="password" placeholder="Bekreft passord" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Oppretter konto..." : "Opprett konto"}
                        </button>
                    </form>
                    <p className="auth-link">Har allerede konto? <Link to="/login">Logg inn</Link></p>
                </div>
            </div>
        </div>
    );
}
