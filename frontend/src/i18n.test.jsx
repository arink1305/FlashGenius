import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLang } from "./i18n";

describe("useLang", () => {
    beforeEach(() => {
        localStorage.setItem("lang", "no");
    });

    it("returns Norwegian by default", () => {
        const { result } = renderHook(() => useLang());
        expect(result.current.t("dashTitle")).toBe("Mine sett 🧠");
    });

    it("interpolates variables", () => {
        const { result } = renderHook(() => useLang());
        expect(result.current.t("cardOf", { i: 1, n: 5 })).toBe("Kort 1 av 5");
    });

    it("switches the whole app to English via setLang", () => {
        const { result } = renderHook(() => useLang());
        act(() => result.current.setLang("en"));
        expect(result.current.t("dashTitle")).toBe("My sets 🧠");
        expect(result.current.t("cardOf", { i: 2, n: 3 })).toBe("Card 2 of 3");
    });

    it("falls back to the key for unknown strings", () => {
        const { result } = renderHook(() => useLang());
        expect(result.current.t("finnesIkke")).toBe("finnesIkke");
    });
});
