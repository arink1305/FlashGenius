import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App routes", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("lang", "no");
    });

    it("renders the landing page when logged out", () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText("Gjør notater om til")).toBeInTheDocument();
        expect(screen.getAllByText("FlashGenius").length).toBeGreaterThan(0);
    });

    it("renders all four tiers on the pricing page", () => {
        render(
            <MemoryRouter initialEntries={["/pricing"]}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText("Plus")).toBeInTheDocument();
        expect(screen.getByText("Pro")).toBeInTheDocument();
        expect(screen.getByText("Ultra")).toBeInTheDocument();
        expect(screen.getByText("Mest populær")).toBeInTheDocument();
    });

    it("shows author credit and contacts in the footer", () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText("Arin Kehreman")).toBeInTheDocument();
        expect(screen.getByText("arink1305")).toBeInTheDocument();
        expect(screen.getByText("ashakongen12@gmail.com")).toBeInTheDocument();
    });

    it("renders the login page", () => {
        render(
            <MemoryRouter initialEntries={["/login"]}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText("Velkommen tilbake")).toBeInTheDocument();
    });
});
