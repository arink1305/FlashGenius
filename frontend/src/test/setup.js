import "@testing-library/jest-dom";

if (typeof globalThis.localStorage === "undefined") {
    const store = {};
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: (key) => (key in store ? store[key] : null),
            setItem: (key, value) => { store[key] = String(value); },
            removeItem: (key) => { delete store[key]; },
            clear: () => { for (const key in store) delete store[key]; },
        },
    });
}
