import { useEffect, useLayoutEffect, useRef, useState } from "react";

const defaultEndpoint = "http://rdf.insee.fr/sparql";
const defaultPrefix = "https://rdf.insee.fr/sparql?query=DESCRIBE";

interface Query {
    label: string;
    path: string;
}

interface Configuration {
    sparql_endpoint?: string;
    prefix?: string;
}

interface EditorProps {
    endpoint: string;
    queries: Query[];
    prefix: string;
}

function Editor({ endpoint, queries, prefix }: EditorProps) {
    const [yasgui, setYasgui] = useState<YasguiInstance>();
    const [counter, setCounter] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const [inserted, setInserted] = useState(false);

    useLayoutEffect(() => {
        if (counter > 100 || inserted) {
            return;
        }
        const yasqe = document.querySelector(".yasqe");
        if (yasqe && ref.current) {
            yasqe.appendChild(ref.current);
            setInserted(true);
        }
        setCounter(counter + 1);
    }, [counter, inserted]);

    const click = (query: Query) => {
        if (!yasgui) {
            return;
        }
        fetch(query.path)
            .then(response => response.text())
            .then(body => {
                const tab = yasgui.getTab();
                tab.setQuery(body);
            });
    };

    useLayoutEffect(() => {
        const element = editorRef.current;
        if (!element || element.getAttribute("data-yasgui") === "true") {
            return;
        }
        localStorage.removeItem("yagui__config");
        element.setAttribute("data-yasgui", "true");
        setYasgui(
            new Yasgui(element, {
                requestConfig: {
                    endpoint
                }
            })
        );
    }, [endpoint]);

    return (
        <>
            <div className="queries-block" ref={ref}>
                {queries.map((query, i) => (
                    <button type="button" key={i} onClick={() => click(query)}>
                        {" "}
                        {query.label}{" "}
                    </button>
                ))}
            </div>
            <div
                id="editor"
                ref={editorRef}
                onClick={e => {
                    const target = e.target as HTMLAnchorElement;
                    if (
                        endpoint !== defaultEndpoint &&
                        target.href &&
                        target.href.indexOf("http://id.insee.fr/") === 0 &&
                        target.href.indexOf(prefix) !== 0
                    ) {
                        target.href = prefix + encodeURIComponent(`<${target.href}>`);
                    }
                }}
            ></div>
        </>
    );
}

function App() {
    const [queries, setQueries] = useState<Query[]>([]);
    const [prefix, setPrefix] = useState<string>();
    const [endpoint, setEndpoint] = useState<string>();

    useEffect(() => {
        fetch("/queries/queries.json")
            .then(response => response.json())
            .then((body: Query[]) => {
                setQueries(body);
            });
    }, []);

    useEffect(() => {
        fetch("/configuration.json")
            .then(response => response.json())
            .then((configuration: Configuration) => {
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
            {endpoint && prefix && <Editor endpoint={endpoint} queries={queries} prefix={prefix} />}
            <footer>
                <p>{footer}</p>
            </footer>
        </div>
    );
}

export default App;
