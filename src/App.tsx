import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadQueries, loadQueryBody, type Query } from "./api";

// Toute la configuration vit dans .env : Vite remplace `import.meta.env.VITE_*`
// par sa valeur litterale a la construction du bundle. La surcharger revient
// donc a rejouer un build (`VITE_SPARQL_ENDPOINT=... pnpm build`), la ou
// l'ancien public/configuration.json etait lu au demarrage de l'application.

// Espace de nommage des URI Insee. C'est un identifiant RDF, pas une adresse
// que l'application contacte : le `http://` fait partie de l'URI publiée par
// l'Insee et ne peut pas être réécrit en `https://` sans cesser de désigner la
// même ressource. Aucune requête n'est émise vers cette valeur — les liens qui
// la portent sont justement réécrits ci-dessous vers l'endpoint configuré.
const INSEE_IRI_NAMESPACE = "http://id.insee.fr/";

interface EditorProps {
    endpoint: string;
    queries: Query[];
    prefix: string;
}

function Editor({ endpoint, queries, prefix }: Readonly<EditorProps>) {
    const yasguiRef = useRef<Yasgui | null>(null);
    const queriesRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const editor = editorRef.current;
        if (!editor || editor.dataset.yasgui === "true") {
            return;
        }
        localStorage.removeItem("yagui__config");
        editor.dataset.yasgui = "true";
        yasguiRef.current = new Yasgui(editor, {
            requestConfig: {
                endpoint
            }
        });
    }, [endpoint]);

    // Le bloc de boutons est rendu par React puis déplacé dans la barre
    // d'édition construite par Yasgui. Celle-ci est créée par le constructeur
    // ci-dessus, donc déjà présente à ce stade ; l'observateur ne sert que de
    // filet si une version de Yasgui la rendait plus tard.
    useLayoutEffect(() => {
        const editor = editorRef.current;
        const queriesBlock = queriesRef.current;
        if (!editor || !queriesBlock) {
            return undefined;
        }

        const insertQueriesBlock = () => {
            const yasqe = editor.querySelector(".yasqe");
            if (!yasqe) {
                return false;
            }
            yasqe.appendChild(queriesBlock);
            return true;
        };

        if (insertQueriesBlock()) {
            return undefined;
        }

        const observer = new MutationObserver(() => {
            if (insertQueriesBlock()) {
                observer.disconnect();
            }
        });
        observer.observe(editor, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    // Les liens produits par Yasgui pointent vers les URI id.insee.fr. On les
    // réécrit vers la requête DESCRIBE de l'instance configurée, via une
    // délégation d'évènement sur le conteneur (et non un `onClick` React, qui
    // rendrait ce `div` interactif pour les technologies d'assistance).
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return undefined;
        }

        const rewriteDescribeLinks = (event: MouseEvent) => {
            const { target } = event;
            if (
                endpoint !== import.meta.env.VITE_INSEE_SPARQL_ENDPOINT &&
                target instanceof HTMLAnchorElement &&
                target.href.startsWith(INSEE_IRI_NAMESPACE) &&
                !target.href.startsWith(prefix)
            ) {
                target.href = prefix + encodeURIComponent(`<${target.href}>`);
            }
        };

        editor.addEventListener("click", rewriteDescribeLinks);
        return () => editor.removeEventListener("click", rewriteDescribeLinks);
    }, [endpoint, prefix]);

    const click = (query: Query) => {
        loadQueryBody(query.path)
            .then(body => {
                yasguiRef.current?.getTab().setQuery(body);
            })
            .catch((error: unknown) => {
                console.error(`Impossible de charger la requête ${query.path}`, error);
            });
    };

    return (
        <>
            <div className="queries-block" ref={queriesRef}>
                {queries.map(query => (
                    <button type="button" key={query.path} onClick={() => click(query)}>
                        {" "}
                        {query.label}{" "}
                    </button>
                ))}
            </div>
            <div id="editor" ref={editorRef}></div>
        </>
    );
}

function App() {
    const [queries, setQueries] = useState<Query[]>([]);
    const endpoint = import.meta.env.VITE_SPARQL_ENDPOINT;
    const prefix = import.meta.env.VITE_SPARQL_PREFIX;

    useEffect(() => {
        loadQueries()
            .then(body => {
                setQueries(body);
            })
            .catch((error: unknown) => {
                console.error("Impossible de charger la liste des requêtes", error);
                setQueries([]);
            });
    }, []);

    const footer = `${import.meta.env.VITE_NAME?.toUpperCase()} : v${import.meta.env.VITE_VERSION}`;

    return (
        <div className="App">
            <Editor endpoint={endpoint} queries={queries} prefix={prefix} />
            <footer>
                <p>{footer}</p>
            </footer>
        </div>
    );
}

export default App;
