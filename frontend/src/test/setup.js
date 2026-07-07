import "@testing-library/jest-dom";

if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
    };
}

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
