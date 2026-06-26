import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Logo from "./Logo";

describe("Logo", () => {
    it("renders an accessible SVG logo", () => {
        const { getByLabelText } = render(<Logo />);
        const svg = getByLabelText("FlashGenius");
        expect(svg.tagName.toLowerCase()).toBe("svg");
    });

    it("applies the passed className", () => {
        const { getByLabelText } = render(<Logo className="topbar-logo-icon" />);
        expect(getByLabelText("FlashGenius")).toHaveClass("topbar-logo-icon");
    });
});
