import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi, type Mock } from "vitest";
import App from "./App";
import type { Query } from "./api";

const queries: Query[] = [
    { label: "Région par son nom", path: "/queries/region_nom.txt" },
    { label: "Liste des concepts", path: "/queries/liste_concepts.txt" }
];

// La réponse renvoyée par les stubs de `fetch` : seule la portion de l'API
// Response consommée par src/api.ts est simulée.
const fetchResponse = (url: string, ok = true, payload: Query[] = queries) => ({
    ok,
    status: ok ? 200 : 404,
    statusText: ok ? "OK" : "Not Found",
    json: () => Promise.resolve(payload),
    text: () => Promise.resolve(`# ${url}`)
});

type SetQuery = (query: string) => void;
type FetchStub = (url: string) => Promise<ReturnType<typeof fetchResponse>>;

const editorIn = (container: HTMLElement): HTMLElement => {
    const editor = container.querySelector<HTMLElement>("#editor");
    if (!editor) {
        throw new Error("#editor absent du rendu");
    }
    return editor;
};

const inseeLink = "http://id.insee.fr/geo/region/11";

// Pose un lien id.insee.fr dans l'éditeur monté puis le clique. jsdom suivrait
// réellement la navigation : elle est neutralisée le temps du clic, pour
// n'observer que la réécriture faite par l'application.
const clickInseeLink = async (container: HTMLElement): Promise<HTMLAnchorElement> => {
    await waitFor(() => expect(container.querySelector("#editor")).not.toBeNull());

    const link = document.createElement("a");
    link.href = inseeLink;
    editorIn(container).appendChild(link);

    const preventNavigation = (event: Event) => event.preventDefault();
    document.addEventListener("click", preventNavigation, true);
    try {
        fireEvent.click(link);
    } finally {
        document.removeEventListener("click", preventNavigation, true);
    }

    return link;
};

let setQuery: Mock<SetQuery>;
let yasguiConfig: YasguiConfig | undefined;

beforeEach(() => {
    setQuery = vi.fn<SetQuery>();
    yasguiConfig = undefined;

    vi.stubGlobal(
        "Yasgui",
        class {
            getTab = () => ({ setQuery });

            constructor(element: HTMLElement, config?: YasguiConfig) {
                yasguiConfig = config;
                const yasqe = document.createElement("div");
                yasqe.classList.add("yasqe");
                element.appendChild(yasqe);
            }
        }
    );

    vi.stubGlobal("fetch", (url: string) => Promise.resolve(fetchResponse(url)));
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
    expect(yasguiConfig?.requestConfig?.endpoint).toBe("https://rdf.insee.fr/sparql");
});

test("reads the endpoint from the build-time environment instead of a fetched file", async () => {
    vi.stubEnv("VITE_SPARQL_ENDPOINT", "http://example.org/sparql");
    const fetchSpy = vi.fn<FetchStub>(url => Promise.resolve(fetchResponse(url)));
    vi.stubGlobal("fetch", fetchSpy);

    render(<App />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes("configuration.json"))).toBe(false);
});

test("rewrites id.insee.fr links to the DESCRIBE prefix when a custom endpoint is configured", async () => {
    vi.stubEnv("VITE_SPARQL_ENDPOINT", "http://example.org/sparql");
    vi.stubEnv("VITE_SPARQL_PREFIX", "https://example.org/sparql?query=DESCRIBE");
    const { container } = render(<App />);

    const link = await clickInseeLink(container);

    expect(link.href).toBe(
        `https://example.org/sparql?query=DESCRIBE${encodeURIComponent(`<${inseeLink}>`)}`
    );
});

test("keeps id.insee.fr links untouched on the default endpoint", async () => {
    const { container } = render(<App />);

    const link = await clickInseeLink(container);

    expect(link.href).toBe(inseeLink);
});

test("moves the queries block when Yasgui renders the editor later", async () => {
    // Filet décrit dans App.tsx : si une version de Yasgui construisait `.yasqe`
    // après le montage, l'observateur doit encore y déplacer le bloc.
    vi.stubGlobal(
        "Yasgui",
        class {
            getTab = () => ({ setQuery });

            constructor(element: HTMLElement) {
                setTimeout(() => {
                    const yasqe = document.createElement("div");
                    yasqe.classList.add("yasqe");
                    element.appendChild(yasqe);
                }, 0);
            }
        }
    );

    const { container } = render(<App />);

    await waitFor(() => {
        expect(container.querySelector("#editor .yasqe > .queries-block")).not.toBeNull();
    });
});

test("keeps the app usable when a query body cannot be loaded", async () => {
    vi.stubGlobal("fetch", (url: string) => Promise.resolve(fetchResponse(url, !url.endsWith(".txt"))));
    // `using` n'est pas activé par le parseur SWC de ce projet
    // (jsc.parser.explicitResourceManagement), d'où la restauration explicite.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Liste des concepts" }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(setQuery).not.toHaveBeenCalled();
});

test("ignores manifest entries whose path is not a query file", async () => {
    const hostile: Query[] = [
        { label: "Absolue", path: "https://example.com/steal" },
        { label: "Traversée", path: "/queries/../../etc/passwd" },
        { label: "Protocole", path: "javascript:alert(1)" },
        ...queries
    ];
    const fetchSpy = vi.fn<FetchStub>(url => Promise.resolve(fetchResponse(url, true, hostile)));
    vi.stubGlobal("fetch", fetchSpy);

    render(<App />);

    expect(await screen.findByRole("button", { name: "Liste des concepts" })).toBeTruthy();
    for (const label of ["Absolue", "Traversée", "Protocole"]) {
        expect(screen.queryByRole("button", { name: label })).toBeNull();
    }
});

test("ignores the body of an HTTP error response for the query list", async () => {
    vi.stubGlobal("fetch", (url: string) =>
        Promise.resolve(
            fetchResponse(url, !url.includes("/queries/queries.json"), [
                { label: "Not Found", path: "/error" }
            ])
        )
    );
    // `using` n'est pas activé par le parseur SWC de ce projet
    // (jsc.parser.explicitResourceManagement), d'où la restauration explicite.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(<App />);

    await waitFor(() => expect(container.querySelector("#editor")).not.toBeNull());
    expect(screen.queryByRole("button")).toBeNull();
});
