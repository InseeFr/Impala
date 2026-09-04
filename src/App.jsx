import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { loadConfiguration, loadQueries, loadQueryBody } from "./api";

const defaultEndpoint = "http://rdf.insee.fr/sparql";
const defaultPrefix = "https://rdf.insee.fr/sparql?query=DESCRIBE";

function Editor({ endpoint, queries, prefix }) {
    const yasguiRef = useRef(null);
    const queriesRef = useRef(null);
    const editorRef = useRef(null);

    useLayoutEffect(() => {
        const editor = editorRef.current;
        if (editor.getAttribute("data-yasgui") === "true") {
            return;
        }
        localStorage.removeItem("yagui__config");
        editor.setAttribute("data-yasgui", "true");
        // eslint-disable-next-line no-undef
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
        const insertQueriesBlock = () => {
            const yasqe = editor.querySelector(".yasqe");
            if (!yasqe) {
                return false;
            }
            yasqe.appendChild(queriesRef.current);
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
        const rewriteDescribeLinks = event => {
            const { target } = event;
            if (
                endpoint !== defaultEndpoint &&
                target.href &&
                target.href.indexOf("http://id.insee.fr/") === 0 &&
                target.href.indexOf(prefix) !== 0
            ) {
                target.href = prefix + encodeURIComponent(`<${target.href}>`);
            }
        };

        editor.addEventListener("click", rewriteDescribeLinks);
        return () => editor.removeEventListener("click", rewriteDescribeLinks);
    }, [endpoint, prefix]);

    const click = query => {
        loadQueryBody(query.path)
            .then(body => {
                yasguiRef.current.getTab().setQuery(body);
            })
            .catch(error => {
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

Editor.propTypes = {
    endpoint: PropTypes.string,
    queries: PropTypes.array,
    prefix: PropTypes.string
};

function App() {
    const [queries, setQueries] = useState([]);
    const [prefix, setPrefix] = useState();
    const [endpoint, setEndpoint] = useState();

    useEffect(() => {
        loadQueries()
            .then(body => {
                setQueries(body);
            })
            .catch(error => {
                console.error("Impossible de charger la liste des requêtes", error);
                setQueries([]);
            });
    }, []);

    useEffect(() => {
        loadConfiguration()
            .then(configuration => {
                setEndpoint(configuration.sparql_endpoint ?? defaultEndpoint);
                setPrefix(configuration.prefix ?? defaultPrefix);
            })
            .catch(() => {
                setEndpoint(defaultEndpoint);
                setPrefix(defaultPrefix);
            });
    }, []);

    const footer = `${import.meta.env.VITE_NAME?.toUpperCase()} : v${import.meta.env.VITE_VERSION}`;

    return (
        <div className="App">
            {endpoint && <Editor endpoint={endpoint} queries={queries} prefix={prefix} />}
            <footer>
                <p>{footer}</p>
            </footer>
        </div>
    );
}

export default App;
