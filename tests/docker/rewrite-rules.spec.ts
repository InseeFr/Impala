import { test, expect } from "@playwright/test";

/**
 * Non-regression des regles de reecriture (le fichier nginx.conf.template du
 * depot, installe comme configuration du serveur). Les tests s'executent contre
 * l'image Docker reellement publiee, l'endpoint SPARQL etant remplace par un
 * mock local (voir compose.yaml).
 *
 * Les redirections ne sont jamais suivies : c'est le couple statut + Location
 * qui constitue le contrat de chaque regle.
 */

const html = { Accept: "text/html" };
const rdf = { Accept: "application/rdf+xml" };
const sparqlJson = { Accept: "application/sparql-results+json" };
const noRedirect = { maxRedirects: 0 };

test.describe("Regle 2 : racine", () => {
    test("GET / sert la page d'accueil", async ({ request }) => {
        const response = await request.get("/", { headers: html, ...noRedirect });

        expect(response.status()).toBe(200);
        expect(await response.text()).toContain("<html");
    });
});

test.describe("Regle 3 : ressources statiques", () => {
    for (const path of ["/index.html", "/queries/queries.json"]) {
        test(`GET ${path} est servi tel quel`, async ({ request }) => {
            const response = await request.get(path, { ...noRedirect });

            expect(response.status()).toBe(200);
        });
    }
});

test.describe("Regle 5 : GET programmatique sur /sparql", () => {
    test("est proxifie vers l'endpoint SPARQL, query string comprise", async ({ request }) => {
        const response = await request.get("/sparql?query=SELECT%20*%20WHERE%7B%3Fs%20%3Fp%20%3Fo%7D", {
            headers: sparqlJson,
            ...noRedirect
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.mock).toBe("sparql");
        expect(body.method).toBe("GET");
        expect(body.url).toContain("query=SELECT");
    });
});

test.describe("Regle 6 : formulaire Impala", () => {
    test("GET /sparql depuis un navigateur sert le formulaire, sans proxy", async ({ request }) => {
        const response = await request.get("/sparql/", { headers: html, ...noRedirect });

        expect(response.status()).toBe(200);
        expect(response.headers()["x-sparql-mock"]).toBeUndefined();
        expect(await response.text()).toContain("<html");
    });

    test("les assets JS de l'application sont servis", async ({ request }) => {
        const index = await request.get("/sparql/", { headers: html });
        const asset = /src="([^"]+\.js)"/.exec(await index.text())?.[1];
        expect(asset, "aucun script trouve dans la page du formulaire").toBeTruthy();

        const response = await request.get(asset!, { ...noRedirect });

        expect(response.status()).toBe(200);
    });
});

test.describe("Regle 7 : POST sur /sparql", () => {
    test("est proxifie vers l'endpoint SPARQL avec son payload", async ({ request }) => {
        const response = await request.post("/sparql", {
            headers: { ...sparqlJson, "Content-Type": "application/x-www-form-urlencoded" },
            data: "query=SELECT * WHERE{?s ?p ?o}",
            ...noRedirect
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.method).toBe("POST");
        expect(body.body).toContain("query=SELECT");
    });
});

test.describe("Regle 8 : dereferencement hors navigateur", () => {
    test("redirige en 303 vers rdf.insee.fr en conservant le chemin", async ({ request }) => {
        const response = await request.get("/produits/serie/s1", { headers: rdf, ...noRedirect });

        expect(response.status()).toBe(303);
        expect(response.headers()["location"]).toBe(
            "https://rdf.insee.fr/sparql?query=describe<http://id.insee.fr/produits/serie/s1>"
        );
    });
});

test.describe("Regle 8bis : id.insee.fr dans un navigateur", () => {
    test("redirige en 303 vers un DESCRIBE", async ({ request }) => {
        const response = await request.get("/produits/serie/s1", {
            headers: { ...html, Host: "id.insee.fr" },
            ...noRedirect
        });

        expect(response.status()).toBe(303);
        expect(response.headers()["location"]).toBe(
            "https://rdf.insee.fr/sparql?query=DESCRIBE<http://id.insee.fr/produits/serie/s1>"
        );
    });
});

test.describe("Regle 9 : dereferencement dans un navigateur", () => {
    test("renvoie vers le formulaire Impala avec un DESCRIBE pre-rempli", async ({ request }) => {
        const response = await request.get("/produits/serie/s1", { headers: html, ...noRedirect });

        expect(response.status()).toBe(302);
        expect(decodeURIComponent(response.headers()["location"])).toContain(
            "/sparql?query=DESCRIBE <http://localhost:8080/produits/serie/s1>"
        );
    });
});

test.describe("Regles 10 et 11 : en-tetes", () => {
    test("l'API est ouverte a toutes les origines", async ({ request }) => {
        const response = await request.get("/index.html", { ...noRedirect });

        expect(response.headers()["access-control-allow-origin"]).toBe("*");
    });

    test("l'en-tete Server n'expose pas la version du serveur", async ({ request }) => {
        const response = await request.get("/index.html", { ...noRedirect });

        expect(response.headers()["server"]).toBe("nginx");
    });
});

test.describe("Configuration du serveur", () => {
    test("le fichier de regles n'est jamais servi", async ({ request }) => {
        const response = await request.get("/nginx.conf.template", { ...noRedirect });

        expect(response.status()).not.toBe(200);
        expect(await response.text()).not.toContain("proxy_pass");
    });

    test("les fichiers caches ne sont jamais servis", async ({ request }) => {
        const response = await request.get("/.htaccess", { ...noRedirect });

        expect(response.status()).toBe(403);
    });
});
