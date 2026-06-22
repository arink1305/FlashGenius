export const DECK_TYPES = {
    flashcards: {
        label: "Flashcards",
        icon: "🃏",
        desc: "Spørsmål og svar du kan bla gjennom",
        route: (id) => `/study/${id}`,
    },
    quiz: {
        label: "Quiz",
        icon: "❓",
        desc: "Flervalg eller ja/nei med poengsum",
        route: (id) => `/quiz/${id}`,
    },
    summary: {
        label: "Sammendrag",
        icon: "📝",
        desc: "Kort, strukturert oppsummering",
        route: (id) => `/summary/${id}`,
    },
    mindmap: {
        label: "Tankekart",
        icon: "🧠",
        desc: "Visuelt kart over notatene dine",
        route: (id) => `/mindmap/${id}`,
    },
};

export function deckRoute(type, id) {
    const t = DECK_TYPES[type] || DECK_TYPES.flashcards;
    return t.route(id);
}
