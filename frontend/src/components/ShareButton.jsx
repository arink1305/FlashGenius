import { useState } from "react";
import { Share2, Check } from "lucide-react";
import api from "../api";
import { useMe, hasTier } from "../useMe";
import { useLang } from "../i18n";

export default function ShareButton({ deckId }) {
    const me = useMe();
    const { t } = useLang();
    const [copied, setCopied] = useState(false);

    if (!hasTier(me, "ultra")) return null;

    async function handleShare() {
        try {
            const res = await api.post(`/flashcards/decks/${deckId}/share`);
            const url = `${window.location.origin}/s/${res.data.share_token}`;
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <button className="btn-white-outline" onClick={handleShare} aria-label={t("share")}>
            {copied ? <Check size={15} /> : <Share2 size={15} />}
            {copied ? t("shareCopied") : t("share")}
        </button>
    );
}
