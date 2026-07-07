import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Rocket, Crown } from "lucide-react";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import api from "../api";
import { useLang } from "../i18n";
import { useMe, TIER_ORDER } from "../useMe";

const TIERS = [
    { id: "free", amount: 0, icon: Sparkles, featureKeys: ["pricingFree1", "pricingFree2", "pricingFree3", "pricingFree4"] },
    { id: "plus", amount: 49, icon: Zap, featureKeys: ["pricingPlus1", "pricingPlus2", "pricingPlus3", "pricingPlus4", "pricingPlus5"] },
    { id: "pro", amount: 99, icon: Rocket, popular: true, featureKeys: ["pricingPro1", "pricingPro2", "pricingPro3", "pricingPro4"] },
    { id: "ultra", amount: 149, icon: Crown, featureKeys: ["pricingUltra1", "pricingUltra2", "pricingUltra3", "pricingUltra4"] },
];

export default function Pricing() {
    const { t } = useLang();
    const me = useMe();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [buying, setBuying] = useState(null);
    const [cancelled, setCancelled] = useState(false);
    const [checkoutError, setCheckoutError] = useState(false);
    const loggedIn = !!localStorage.getItem("token");
    const currentTier = me?.tier || "free";

    useEffect(() => {
        if (searchParams.get("upgrade") === "cancelled") {
            setCancelled(true);
            setSearchParams({}, { replace: true });
        }
       
    }, []);

    const tierLabel = (id) => ({ free: t("planFree"), plus: t("planPlus"), pro: t("planPro"), ultra: t("planUltra") }[id]);
    const currentAmount = TIERS.find((tier) => tier.id === currentTier)?.amount || 0;

    async function buy(tierId) {
        if (!loggedIn) {
            navigate("/register");
            return;
        }
        setBuying(tierId);
        setCheckoutError(false);
        try {
            const res = await api.post("/billing/checkout", { tier: tierId });
            window.location.href = res.data.url;
        } catch {
            setCheckoutError(true);
            setBuying(null);
        }
    }

    return (
        <div className="page">
            <Topbar>
                {loggedIn ? (
                    <Link to="/" className="btn-ghost">{t("back")}</Link>
                ) : (
                    <>
                        <Link to="/login" className="btn-ghost">{t("navLogin")}</Link>
                        <Link to="/register" className="btn-primary">{t("navStart")}</Link>
                    </>
                )}
            </Topbar>

            <main className="content">
                <div className="page-header pricing-header">
                    <h1>{t("pricingTitle")}</h1>
                    <p>{t("pricingSub")}</p>
                </div>

                {cancelled && <div className="pricing-notice">{t("upgradeCancelled")}</div>}
                {checkoutError && <p className="error" style={{ marginBottom: 24, textAlign: "center" }}>{t("checkoutError")}</p>}

                <div className="pricing-grid">
                    {TIERS.map((tier, i) => {
                        const Icon = tier.icon;
                        const isCurrent = loggedIn && currentTier === tier.id;
                        const isLower = loggedIn && TIER_ORDER[tier.id] < TIER_ORDER[currentTier];
                        const isUpgrade = loggedIn && !isCurrent && !isLower && tier.amount > 0 && currentAmount > 0;
                        const finalAmount = isUpgrade ? tier.amount - currentAmount : tier.amount;
                        return (
                            <motion.div
                                key={tier.id}
                                className={`pricing-card tier-card-${tier.id} ${tier.popular ? "popular" : ""} ${isCurrent ? "current" : ""}`}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {tier.popular && <div className="popular-badge">{t("pricingPopular")}</div>}
                                <div className="pricing-icon"><Icon size={22} /></div>
                                <h3 className="pricing-tier-name">{tierLabel(tier.id)}</h3>
                                {isUpgrade ? (
                                    <div className="pricing-price-stack">
                                        <span className="pricing-price-old">{tier.amount} kr</span>
                                        <div className="pricing-price">
                                            {finalAmount} kr
                                            <span className="pricing-discount-badge">{t("pricingUpgradeDeal", { amount: currentAmount })}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pricing-price">
                                        {tier.amount === 0 ? t("pricingFreePrice") : `${tier.amount} kr`}
                                    </div>
                                )}
                                <ul className="pricing-features">
                                    {tier.featureKeys.map((key) => (
                                        <li key={key}>
                                            <span className="pricing-check"><Check size={13} /></span>
                                            {t(key)}
                                        </li>
                                    ))}
                                </ul>
                                {isCurrent ? (
                                    <div className="pricing-current-badge">{t("pricingCurrent")}</div>
                                ) : tier.id === "free" ? (
                                    !loggedIn && (
                                        <Link to="/register" className="btn-ghost pricing-btn">{t("pricingStartFree")}</Link>
                                    )
                                ) : isLower ? null : (
                                    <button
                                        className={`pricing-btn ${tier.popular ? "btn-primary" : "btn-ghost"}`}
                                        onClick={() => buy(tier.id)}
                                        disabled={buying !== null}
                                    >
                                        {buying === tier.id ? t("upgrading") : t("pricingChoose", { tier: tierLabel(tier.id) })}
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </main>
            <Footer />
        </div>
    );
}
