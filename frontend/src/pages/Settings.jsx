import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Sun, Moon, Lock, KeyRound, Copy, Check, Sparkles } from "lucide-react";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import api from "../api";
import { useLang } from "../i18n";
import { clearMe, refreshMe, hasTier } from "../useMe";

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
    const [me, setMe] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [upgradeMsg, setUpgradeMsg] = useState("");
    const [upgradeErr, setUpgradeErr] = useState("");
    const [keyLoading, setKeyLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        const sessionId = searchParams.get("session_id");
        const isSuccess = searchParams.get("upgrade") === "success";

        async function load() {
            if (isSuccess && sessionId) {
                setConfirming(true);
                try {
                    const res = await api.post("/billing/confirm", { session_id: sessionId });
                    if (res.data.confirmed && res.data.tier) {
                        const label = { plus: t("planPlus"), pro: t("planPro"), ultra: t("planUltra") }[res.data.tier] || res.data.tier;
                        setUpgradeMsg(t("upgradeSuccess", { tier: label }));
                    } else {
                        setUpgradeErr(t("upgradeFailed"));
                    }
                } catch {
                    setUpgradeErr(t("upgradeFailed"));
                }
                setSearchParams({}, { replace: true });
                setConfirming(false);
            }
            clearMe();
            try {
                setMe(await refreshMe());
            } catch {
                setMe(null);
            }
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleDeleteAccount() {
        if (deleteConfirm !== t("deleteWord")) return;
        await api.delete("/auth/account");
        localStorage.removeItem("token");
        clearMe();
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

    async function generateKey() {
        setKeyLoading(true);
        try {
            const res = await api.post("/auth/api-key");
            setMe({ ...me, api_key: res.data.api_key });
        } finally {
            setKeyLoading(false);
        }
    }

    async function copyKey() {
        await navigator.clipboard.writeText(me.api_key);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }

    const tier = me?.tier || "free";
    const tierLabel = { free: t("planFree"), plus: t("planPlus"), pro: t("planPro"), ultra: t("planUltra") }[tier];
    const canExport = hasTier(me, "plus");
    const isUltra = hasTier(me, "ultra");

    return (
        <div className="page">
            <Topbar>
                <Link to="/" className="btn-ghost">{t("back")}</Link>
            </Topbar>

            <main className="content">
                <div className="page-header">
                    <h1>{t("settings")}</h1>
                    <p>{t("manageAccount")}</p>
                </div>

                <div className="settings-stack">
                    {confirming && <div className="pricing-notice">{t("confirmingPayment")}</div>}
                    {upgradeMsg && <div className="upgrade-success-banner"><Sparkles size={16} /> {upgradeMsg}</div>}
                    {upgradeErr && <p className="error">{upgradeErr}</p>}

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
                                <p><span className={`tier-badge tier-${tier}`}>{tierLabel}</span></p>
                            </div>
                            {tier !== "ultra" && (
                                <Link to="/pricing" className="btn-primary">{t("seePlans")}</Link>
                            )}
                        </div>
                        {tier !== "free" && (
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <p className="settings-thanks">{t("planActiveDesc", { tier: tierLabel })}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {isUltra && (
                        <div className="settings-card">
                            <p className="settings-section-title">{t("apiKeyTitle")}</p>
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <span>{t("apiKeyDesc")}</span>
                                    {me?.api_key && <p className="api-key-value">{me.api_key}</p>}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {me?.api_key && (
                                        <button className="btn-ghost" onClick={copyKey}>
                                            {copied ? <Check size={15} /> : <Copy size={15} />}
                                            {copied ? t("apiKeyCopied") : ""}
                                        </button>
                                    )}
                                    <button className="btn-ghost" onClick={generateKey} disabled={keyLoading}>
                                        <KeyRound size={15} />
                                        {me?.api_key ? t("apiKeyRegenerate") : t("apiKeyGenerate")}
                                    </button>
                                </div>
                            </div>
                        </div>
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
                                    <Sun size={14} /> {t("light")}
                                </button>
                                <button className={`toggle-btn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
                                    <Moon size={14} /> {t("dark")}
                                </button>
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("language")}</span>
                            </div>
                            <div className="toggle-group">
                                <button className={`toggle-btn ${lang === "no" ? "active" : ""}`} onClick={() => setLang("no")}>
                                    Norsk
                                </button>
                                <button className={`toggle-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>
                                    English
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="settings-card">
                        <p className="settings-section-title">{t("data")}</p>
                        <div className="settings-row">
                            <div className="settings-row-label">
                                <span>{t("exportData")}</span>
                                <p>{canExport ? t("exportDesc") : t("exportLocked")}</p>
                            </div>
                            {canExport ? (
                                <button className="btn-ghost" onClick={handleExport}>{t("exportBtn")}</button>
                            ) : (
                                <Link to="/pricing" className="btn-ghost">
                                    <Lock size={14} /> {t("seePlans")}
                                </Link>
                            )}
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
            <Footer />
        </div>
    );
}
