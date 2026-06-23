export const DECK_TYPES = {
    flashcards: { labelKey: "typeFlashcardsLabel", descKey: "typeFlashcardsDesc", icon: "🃏", route: (id) => `/study/${id}` },
    quiz: { labelKey: "typeQuizLabel", descKey: "typeQuizDesc", icon: "❓", route: (id) => `/quiz/${id}` },
    summary: { labelKey: "typeSummaryLabel", descKey: "typeSummaryDesc", icon: "📝", route: (id) => `/summary/${id}` },
    mindmap: { labelKey: "typeMindmapLabel", descKey: "typeMindmapDesc", icon: "🧠", route: (id) => `/mindmap/${id}` },
};

export function deckRoute(type, id) {
    const t = DECK_TYPES[type] || DECK_TYPES.flashcards;
    return t.route(id);
}
