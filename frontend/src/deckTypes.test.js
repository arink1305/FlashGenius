import { describe, it, expect } from "vitest";
import { DECK_TYPES, deckRoute } from "./deckTypes";

describe("deckRoute", () => {
    it("routes each deck type to its viewer", () => {
        expect(deckRoute("flashcards", 1)).toBe("/study/1");
        expect(deckRoute("quiz", 2)).toBe("/quiz/2");
        expect(deckRoute("summary", 3)).toBe("/summary/3");
        expect(deckRoute("mindmap", 4)).toBe("/mindmap/4");
    });

    it("falls back to flashcards for unknown types", () => {
        expect(deckRoute("ukjent", 9)).toBe("/study/9");
    });

    it("has icon and translation keys for every type", () => {
        for (const meta of Object.values(DECK_TYPES)) {
            expect(meta.icon).toBeTruthy();
            expect(meta.labelKey).toBeTruthy();
            expect(typeof meta.route).toBe("function");
        }
    });
});
