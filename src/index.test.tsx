import { afterEach, beforeEach, expect, test, vi } from "vitest";

// index.tsx monte l'application au chargement du module : chaque test le
// réimporte après `vi.resetModules()` pour rejouer cet effet de bord sur un
// DOM neuf.
const importIndex = () => import("./index");

beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";

    vi.stubGlobal("fetch", () =>
        Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve([]),
            text: () => Promise.resolve("")
        })
    );

    vi.stubGlobal(
        "Yasgui",
        class {
            getTab = () => ({ setQuery: () => {} });

            constructor(element: HTMLElement) {
                const yasqe = document.createElement("div");
                yasqe.classList.add("yasqe");
                element.appendChild(yasqe);
            }
        }
    );
});

afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
});

test("mounts the application into the #root element of index.html", async () => {
    const container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);

    await importIndex();

    await vi.waitFor(() => {
        expect(container.querySelector("#editor")).not.toBeNull();
    });
});

test("fails loudly when #root is missing from the page", async () => {
    await expect(importIndex()).rejects.toThrow("Element #root introuvable");
});
