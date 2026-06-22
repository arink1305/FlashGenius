import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Login() {
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
            setError("Feil e-post eller passord");
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-left-content">
                    <span className="auth-left-icon">⚡</span>
                    <h2>Lær smartere</h2>
                    <p>Gjør notater om til flashcards på sekunder og mestre ethvert fag raskere.</p>
                </div>
                <div className="auth-features">
                    <div className="auth-feature"><span className="auth-feature-icon">🧠</span> AI genererer spørsmål automatisk</div>
                    <div className="auth-feature"><span className="auth-feature-icon">⚙️</span> Velg antall kort og vanskelighetsgrad</div>
                    <div className="auth-feature"><span className="auth-feature-icon">📊</span> Hold oversikt over alle settene dine</div>
                </div>
            </div>
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">⚡</div>
                        <span className="auth-logo-name">FlashGenius</span>
                    </div>
                    <h2 className="auth-title">Velkommen tilbake</h2>
                    <p className="auth-subtitle">Logg inn for å fortsette å lære</p>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder="Passord" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Logger inn..." : "Logg inn"}
                        </button>
                    </form>
                    <p className="auth-link">Har ikke konto? <Link to="/register">Registrer deg</Link></p>
                </div>
            </div>
        </div>
    );
}
