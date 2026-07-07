import { WalletCards, CircleHelp, FileText, Network } from "lucide-react";

export const DECK_TYPES = {
    flashcards: { labelKey: "typeFlashcardsLabel", descKey: "typeFlashcardsDesc", icon: WalletCards, color: "#6366f1", grad: "var(--grad-main)", route: (id) => `/study/${id}` },
    quiz: { labelKey: "typeQuizLabel", descKey: "typeQuizDesc", icon: CircleHelp, color: "#f59e0b", grad: "var(--grad-warm)", route: (id) => `/quiz/${id}` },
    summary: { labelKey: "typeSummaryLabel", descKey: "typeSummaryDesc", icon: FileText, color: "#06b6d4", grad: "var(--grad-cool)", route: (id) => `/summary/${id}` },
    mindmap: { labelKey: "typeMindmapLabel", descKey: "typeMindmapDesc", icon: Network, color: "#10b981", grad: "var(--grad-green)", minTier: "plus", route: (id) => `/mindmap/${id}` },
};

export function deckRoute(type, id) {
    const t = DECK_TYPES[type] || DECK_TYPES.flashcards;
    return t.route(id);
}
