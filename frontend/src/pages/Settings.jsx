import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import api from "../api";
import { useLang } from "../i18n";

function getEmail() {
    try {
        const payload = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
        return payload.email || payload.sub || "Ukjent";
    } catch {
        return "Ukjent";
    }
}

export default function Settings() {
    const navigate = useNavigate();
    const email = getEmail();
    const { t, lang, setLang } = useLang();
    const [searchParams, setSearchParams] = useSearchParams();

    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [showDelete, setShowDelete] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [upgradeMsg, setUpgradeMsg] = useState("");

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        api.get("/auth/me").then((res) => setIsPro(res.data.is_pro)).catch(() => {});
    }, []);

    useEffect(() => {
        const sessionId = searchParams.get("session_id");
        if (searchParams.get("upgrade") === "success" && sessionId) {
            api.post("/billing/confirm", { session_id: sessionId }).then((res) => {
                if (res.data.is_pro) {
                    setIsPro(true);
                    setUpgradeMsg(t("upgradeSuccess"));
                }
                setSearchParams({}, { replace: true });
            }).catch(() => setSearchParams({}, { replace: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleUpgrade() {
        setUpgrading(true);
        try {
            const res = await api.post("/billing/checkout");
            window.location.href = res.data.url;
        } catch {
            setUpgrading(false);
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirm !== t("deleteWord")) return;
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
                    <Logo className="topbar-logo-icon" />
                    <span className="topbar-logo-name">FlashGenius</span>
                </Link>
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </header>

            <main className="content">
                <div className="page-header">
                    <h1>{t("settings")}</h1>
                    <p>{t("manageAccount")}</p>
                </div>

                <div className="settings-stack">
                    <div className="settings-card">
                        <p className="settings-section-title">{t("account")}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("email")}</span>
                                <p>{email}</p>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("plan")}</span>
                                <p>{isPro ? t("planPro") : t("planFree")}</p>
                            </div>
                        </div>
                    </div>

                    {isPro ? (
                        <div className="settings-card pro-card">
                            <p className="settings-section-title">{t("proActiveTitle")}</p>
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <p>{t("proActiveDesc")}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="settings-card pro-card">
                            <p className="settings-section-title">✨ {t("upgradeTitle")}</p>
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <p>{t("upgradeDesc")}</p>
                                    {upgradeMsg && <p className="settings-success">{upgradeMsg}</p>}
                                </div>
                                <button className="btn-primary" onClick={handleUpgrade} disabled={upgrading}>
                                    {upgrading ? t("upgrading") : t("upgradeBtn")}
                                </button>
                            </div>
                        </div>
                    )}

                    {upgradeMsg && isPro && (
                        <p className="settings-success" style={{ marginTop: "-8px" }}>{upgradeMsg}</p>
                    )}

                    <div className="settings-card">
                        <p className="settings-section-title">{t("changePassword")}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("changePassword")}</span>
                                <p>{t("changePasswordDesc")}</p>
                            </div>
                            <Link to="/change-password" className="btn-ghost">{t("change")}</Link>
                        </div>
                    </div>

                    <div className="settings-card">
                        <p className="settings-section-title">{t("appearance")}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("theme")}</span>
                            </div>
                            <div className="toggle-group">
                                <button className={`toggle-btn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
                                    ☀️ {t("light")}
                                </button>
                                <button className={`toggle-btn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
                                    🌙 {t("dark")}
                                </button>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("language")}</span>
                            </div>
                            <div className="toggle-group">
                                <button className={`toggle-btn ${lang === "no" ? "active" : ""}`} onClick={() => setLang("no")}>
                                    🇳🇴 Norsk
                                </button>
                                <button className={`toggle-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>
                                    🇬🇧 English
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="settings-card">
                        <p className="settings-section-title">{t("data")}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("exportData")}</span>
                                <p>{t("exportDesc")}</p>
                            </div>
                            <button className="btn-ghost" onClick={handleExport}>{t("exportBtn")}</button>
                        </div>
                    </div>

                    <div className="settings-card settings-danger-card">
                        <p className="settings-section-title danger-title">{t("dangerZone")}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("deleteAccount")}</span>
                                <p>{t("deleteDesc")}</p>
                            </div>
                            <button className="btn-danger" onClick={() => setShowDelete(!showDelete)}>
                                {t("deleteAccount")}
                            </button>
                        </div>
                        {showDelete && (
                            <div className="delete-confirm">
                                <p>{t("deleteConfirm")}</p>
                                <div className="delete-confirm-row">
                                    <input
                                        type="text"
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        placeholder={t("deleteWord")}
                                    />
                                    <button
                                        className="btn-danger"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirm !== t("deleteWord")}
                                    >
                                        {t("deleteAccount")}
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
