// Faux endpoint SPARQL utilise par les tests des regles de reecriture.
// Il repond a tout par un JSON decrivant la requete recue : les tests peuvent
// ainsi verifier que nginx a bien proxifie la requete, avec la bonne methode
// et la bonne query string, sans dependre du vrai endpoint de production.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8081);

createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
        res.writeHead(200, {
            "Content-Type": "application/sparql-results+json",
            "X-Sparql-Mock": "true"
        });
        res.end(
            JSON.stringify({
                mock: "sparql",
                method: req.method,
                url: req.url,
                body
            })
        );
    });
}).listen(PORT, () => console.log(`sparql-mock listening on ${PORT}`));
