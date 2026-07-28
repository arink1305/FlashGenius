import { WalletCards, CircleHelp, FileText, Network } from "lucide-react";

export const DECK_TYPES = {
    flashcards: { labelKey: "typeFlashcardsLabel", descKey: "typeFlashcardsDesc", icon: WalletCards, color: "#B24824", grad: "var(--grad-main)", route: (id) => `/study/${id}` },
    quiz: { labelKey: "typeQuizLabel", descKey: "typeQuizDesc", icon: CircleHelp, color: "#8C6D1F", grad: "var(--grad-warm)", route: (id) => `/quiz/${id}` },
    summary: { labelKey: "typeSummaryLabel", descKey: "typeSummaryDesc", icon: FileText, color: "#46647A", grad: "var(--grad-cool)", route: (id) => `/summary/${id}` },
    mindmap: { labelKey: "typeMindmapLabel", descKey: "typeMindmapDesc", icon: Network, color: "#4A7A57", grad: "var(--grad-green)", minTier: "plus", route: (id) => `/mindmap/${id}` },
};

export function deckRoute(type, id) {
    const t = DECK_TYPES[type] || DECK_TYPES.flashcards;
    return t.route(id);
}
