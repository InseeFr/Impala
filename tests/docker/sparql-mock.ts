// Faux endpoint SPARQL utilise par les tests des regles de reecriture.
// Il repond a tout par un JSON decrivant la requete recue : les tests peuvent
// ainsi verifier que nginx a bien proxifie la requete, avec la bonne methode
// et la bonne query string, sans dependre du vrai endpoint de production.
//
// Les donnees de la requete etant renvoyees telles quelles, elles sont traitees
// comme non fiables :
// - la methode est restreinte a une liste blanche ;
// - les caracteres HTML sensibles sont echappes dans le JSON (<...) : le
//   JSON reste identique une fois parse, mais devient inoffensif si un
//   navigateur venait a l'interpreter comme du HTML (XSS reflechi) ;
// - le sniffing de Content-Type est desactive.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8081);
const ALLOWED_METHODS = ["GET", "POST", "HEAD", "OPTIONS"];

function safeMethod(method: string | undefined): string {
    return ALLOWED_METHODS.find(allowed => allowed === method) ?? "UNSUPPORTED";
}

function toSafeJson(value: unknown): string {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026");
}

createServer((req, res) => {
    let body = "";
    req.on("data", (chunk: Buffer | string) => (body += chunk));
    req.on("end", () => {
        res.writeHead(200, {
            "Content-Type": "application/sparql-results+json",
            "X-Content-Type-Options": "nosniff",
            "X-Sparql-Mock": "true"
        });
        res.end(
            toSafeJson({
                mock: "sparql",
                method: safeMethod(req.method),
                url: req.url ?? "",
                body
            })
        );
    });
}).listen(PORT, () => console.log(`sparql-mock listening on ${PORT}`));
