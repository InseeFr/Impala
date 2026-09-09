import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";

const queries = [
    { label: "Région par son nom", path: "/queries/region_nom.txt" },
    { label: "Liste des concepts", path: "/queries/liste_concepts.txt" }
];

let setQuery;
let yasguiConfig;

beforeEach(() => {
    setQuery = vi.fn();
    yasguiConfig = undefined;

    vi.stubGlobal("Yasgui", function Yasgui(element, config) {
        yasguiConfig = config;
        const yasqe = document.createElement("div");
        yasqe.classList.add("yasqe");
        element.appendChild(yasqe);
        this.getTab = () => ({ setQuery });
    });

    vi.stubGlobal("fetch", url =>
        Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(queries),
            text: () => Promise.resolve(`# ${url}`)
        })
    );
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

test("renders the App component", () => {
    render(<App />);
});

test("moves the queries block inside the YASQE editor", async () => {
    const { container } = render(<App />);

    await waitFor(() => {
        expect(container.querySelector("#editor .yasqe > .queries-block")).not.toBeNull();
    });
});

test("renders one button per configured query", async () => {
    render(<App />);

    for (const query of queries) {
        expect(await screen.findByRole("button", { name: query.label })).toBeTruthy();
    }
});

test("loads the query body into the current tab when a query button is clicked", async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Liste des concepts" }));

    await waitFor(() => {
        expect(setQuery).toHaveBeenCalledWith("# /queries/liste_concepts.txt");
    });
});

test("configures Yasgui with the endpoint declared in .env", async () => {
    render(<App />);

    await waitFor(() => expect(yasguiConfig).toBeDefined());
    expect(yasguiConfig.requestConfig.endpoint).toBe("http://rdf.insee.fr/sparql");
});

test("reads the endpoint from the build-time environment instead of a fetched file", async () => {
    vi.stubEnv("VITE_SPARQL_ENDPOINT", "http://example.org/sparql");
    const fetchSpy = vi.fn(url =>
        Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            json: () => Promise.resolve(queries),
            text: () => Promise.resolve(`# ${url}`)
        })
    );
    vi.stubGlobal("fetch", fetchSpy);

    render(<App />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes("configuration.json"))).toBe(false);
});

test("rewrites id.insee.fr links to the DESCRIBE prefix when a custom endpoint is configured", async () => {
    vi.stubEnv("VITE_SPARQL_ENDPOINT", "http://example.org/sparql");
    vi.stubEnv("VITE_SPARQL_PREFIX", "https://example.org/sparql?query=DESCRIBE");
    const { container } = render(<App />);

    await waitFor(() => expect(container.querySelector("#editor")).not.toBeNull());
    const link = document.createElement("a");
    link.href = "http://id.insee.fr/geo/region/11";
    container.querySelector("#editor").appendChild(link);

    const preventNavigation = event => event.preventDefault();
    document.addEventListener("click", preventNavigation, true);
    try {
        fireEvent.click(link);
    } finally {
        document.removeEventListener("click", preventNavigation, true);
    }

    expect(link.href).toBe(
        `https://example.org/sparql?query=DESCRIBE${encodeURIComponent(
            "<http://id.insee.fr/geo/region/11>"
        )}`
    );
});

test("keeps id.insee.fr links untouched on the default endpoint", async () => {
    const { container } = render(<App />);

    await waitFor(() => expect(container.querySelector("#editor")).not.toBeNull());
    const link = document.createElement("a");
    link.href = "http://id.insee.fr/geo/region/11";
    container.querySelector("#editor").appendChild(link);

    const preventNavigation = event => event.preventDefault();
    document.addEventListener("click", preventNavigation, true);
    try {
        fireEvent.click(link);
    } finally {
        document.removeEventListener("click", preventNavigation, true);
    }

    expect(link.href).toBe("http://id.insee.fr/geo/region/11");
});

test("ignores the body of an HTTP error response for the query list", async () => {
    vi.stubGlobal("fetch", url =>
        Promise.resolve({
            ok: !url.includes("/queries/queries.json"),
            status: url.includes("/queries/queries.json") ? 404 : 200,
            statusText: url.includes("/queries/queries.json") ? "Not Found" : "OK",
            json: () => Promise.resolve([{ label: "Not Found", path: "/error" }]),
            text: () => Promise.resolve(`# ${url}`)
        })
    );
    // `using` n'est pas activé par le parseur SWC de ce projet
    // (jsc.parser.explicitResourceManagement), d'où la restauration explicite.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(<App />);

    await waitFor(() => expect(container.querySelector("#editor")).not.toBeNull());
    expect(screen.queryByRole("button")).toBeNull();
});
