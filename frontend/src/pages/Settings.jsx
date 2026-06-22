import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function getEmail() {
    try {
        const payload = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
        return payload.email || payload.sub || "Ukjent";
    } catch {
        return "Ukjent";
    }
}

const translations = {
    no: {
        settings: "Innstillinger",
        manageAccount: "Administrer kontoen din",
        account: "Konto",
        email: "E-post",
        plan: "Plan",
        free: "Gratis",
        changePassword: "Endre passord",
        currentPassword: "Nåværende passord",
        newPassword: "Nytt passord",
        save: "Lagre",
        saving: "Lagrer...",
        appearance: "Utseende",
        theme: "Tema",
        light: "Lys",
        dark: "Mørk",
        language: "Språk",
        data: "Data",
        exportData: "Eksporter data",
        exportDesc: "Last ned alle flashcard-settene dine som JSON",
        exportBtn: "Last ned JSON",
        dangerZone: "Faresone",
        deleteAccount: "Slett konto",
        deleteDesc: "Dette sletter kontoen og alle sett permanent.",
        deleteBtn: "Slett konto",
        deleteConfirm: "Er du sikker? Dette kan ikke angres. Skriv SLETT for å bekrefte:",
        wrongPassword: "Feil nåværende passord",
        passwordUpdated: "Passord oppdatert!",
        back: "← Tilbake",
    },
    en: {
        settings: "Settings",
        manageAccount: "Manage your account",
        account: "Account",
        email: "Email",
        plan: "Plan",
        free: "Free",
        changePassword: "Change password",
        currentPassword: "Current password",
        newPassword: "New password",
        save: "Save",
        saving: "Saving...",
        appearance: "Appearance",
        theme: "Theme",
        light: "Light",
        dark: "Dark",
        language: "Language",
        data: "Data",
        exportData: "Export data",
        exportDesc: "Download all your flashcard decks as JSON",
        exportBtn: "Download JSON",
        dangerZone: "Danger zone",
        deleteAccount: "Delete account",
        deleteDesc: "This permanently deletes your account and all decks.",
        deleteBtn: "Delete account",
        deleteConfirm: "Are you sure? This cannot be undone. Type DELETE to confirm:",
        wrongPassword: "Wrong current password",
        passwordUpdated: "Password updated!",
        back: "← Back",
    },
};

export default function Settings() {
    const navigate = useNavigate();
    const email = getEmail();

    const [lang, setLang] = useState(() => localStorage.getItem("lang") || "no");
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [showDelete, setShowDelete] = useState(false);

    const t = translations[lang];

    useEffect(() => {
        localStorage.setItem("lang", lang);
    }, [lang]);

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    async function handlePasswordChange(e) {
        e.preventDefault();
        setPwLoading(true);
        setPwError("");
        setPwSuccess(false);
        try {
            await api.put("/auth/password", { current_password: currentPw, new_password: newPw });
            setPwSuccess(true);
            setCurrentPw("");
            setNewPw("");
        } catch {
            setPwError(t.wrongPassword);
        } finally {
            setPwLoading(false);
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirm !== (lang === "no" ? "SLETT" : "DELETE")) return;
        await api.delete("/auth/account");
        localStorage.removeItem("token");
        navigate("/login");
    }

    function handleExport() {
        api.get("/flashcards/export").then((res) => {
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "flashgenius-export.json";
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    return (
        <div className="page">
            <header className="topbar">
                <Link to="/" className="topbar-logo">
                    <div className="topbar-logo-icon">⚡</div>
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/" className="btn-ghost">{t.back}</Link>
            </header>

            <main className="content">
                <div className="page-header">
                    <h1>{t.settings}</h1>
                    <p>{t.manageAccount}</p>
                </div>

                <div className="settings-stack">
                    <div className="settings-card">
                        <p className="settings-section-title">{t.account}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t.email}</span>
                                <p>{email}</p>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t.plan}</span>
                                <p>{t.free}</p>
                            </div>
                        </div>
                    </div>

                    <div className="settings-card">
                        <p className="settings-section-title">{t.changePassword}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t.changePassword}</span>
                                <p>{lang === "no" ? "Bytt til et nytt passord" : "Switch to a new password"}</p>
                            </div>
                            <Link to="/change-password" className="btn-ghost">{lang === "no" ? "Endre →" : "Change →"}</Link>
                        </div>
                    </div>

                    <div className="settings-card">
                        <p className="settings-section-title">{t.appearance}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t.theme}</span>
                            </div>
                            <div className="toggle-group">
                                <button
                                    className={`toggle-btn ${theme === "light" ? "active" : ""}`}
                                    onClick={() => setTheme("light")}
                                >
                                    ☀️ {t.light}
                                </button>
                                <button
                                    className={`toggle-btn ${theme === "dark" ? "active" : ""}`}
                                    onClick={() => setTheme("dark")}
                                >
                                    🌙 {t.dark}
                                </button>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t.language}</span>
                            </div>
                            <div className="toggle-group">
                                <button
                                    className={`toggle-btn ${lang === "no" ? "active" : ""}`}
                                    onClick={() => setLang("no")}
                                >
                                    🇳🇴 Norsk
                                </button>
                                <button
                                    className={`toggle-btn ${lang === "en" ? "active" : ""}`}
                                    onClick={() => setLang("en")}
                                >
                                    🇬🇧 English
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="settings-card">
                        <p className="settings-section-title">{t.data}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t.exportData}</span>
                                <p>{t.exportDesc}</p>
                            </div>
                            <button className="btn-ghost" onClick={handleExport}>{t.exportBtn}</button>
                        </div>
                    </div>

                    <div className="settings-card settings-danger-card">
                        <p className="settings-section-title danger-title">{t.dangerZone}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t.deleteAccount}</span>
                                <p>{t.deleteDesc}</p>
                            </div>
                            <button className="btn-danger" onClick={() => setShowDelete(!showDelete)}>
                                {t.deleteBtn}
                            </button>
                        </div>
                        {showDelete && (
                            <div className="delete-confirm">
                                <p>{t.deleteConfirm}</p>
                                <div className="delete-confirm-row">
                                    <input
                                        type="text"
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        placeholder={lang === "no" ? "SLETT" : "DELETE"}
                                    />
                                    <button
                                        className="btn-danger"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirm !== (lang === "no" ? "SLETT" : "DELETE")}
                                    >
                                        {t.deleteBtn}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
