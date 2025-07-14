"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

const defaultEndpoint = "/sparql";
const defaultPrefix = "https://rdf.insee.fr/sparql?query=DESCRIBE";
type YasguiType = {
    getTab: () => {
        setQuery: (query: string) => void;
    };
};
declare global {
    interface Window {
        Yasgui: new (
            container: HTMLElement,
            config?: {
                requestConfig?: {
                    endpoint?: string;
                };
            }
        ) => YasguiType;
    }
}

function Editor({
    endpoint,
    queries,
    prefix
}: {
    endpoint: string;
    queries: { path: string; label: string }[];
    prefix: string;
}) {
    const [yasgui, setYasgui] = useState<YasguiType>();
    const [counter, setCounter] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const [inserted, setInserted] = useState(false);

    useLayoutEffect(() => {
        if (counter > 100 || inserted) {
            return;
        }
        const yasque = document.querySelector(".yasqe");
        if (yasque !== null && ref.current !== null) {
            yasque.appendChild(ref.current);
            setInserted(true);
        }
        setCounter(counter + 1);
    }, [counter, inserted]);

    const click = (query: { path: string }) => {
        fetch(query.path)
            .then(response => response.text())
            .then(body => {
                if (!!yasgui) {
                    const tab = yasgui.getTab();
                    tab.setQuery(body);
                }
            });
    };

    useLayoutEffect(() => {
        if (!editorRef.current) {
            return;
        }
        if (editorRef.current.getAttribute("data-yasgui") === "true") {
            return;
        }
        localStorage.removeItem("yagui__config");
        editorRef.current.setAttribute("data-yasgui", "true");
        setYasgui(
            new window.Yasgui(editorRef.current, {
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
                    const link = e.target as HTMLLinkElement;
                    if (
                        endpoint !== defaultEndpoint &&
                        link.href &&
                        link.href.indexOf("http://id.insee.fr/") === 0 &&
                        link.href.indexOf(prefix) !== 0
                    ) {
                        link.href = prefix + encodeURIComponent(`<${link.href}>`);
                    }
                }}
            ></div>
        </>
    );
}

function App() {
    const [queries, setQueries] = useState<{ path: string; label: string }[]>([]);
    const [prefix, setPrefix] = useState<string>();
    const [endpoint, setEndpoint] = useState<string>();

    useEffect(() => {
        fetch("/queries/queries.json")
            .then(response => response.json())
            .then(body => {
                setQueries(body);
            });
    }, []);

    useEffect(() => {
        fetch("/configuration.json")
            .then(response => response.json())
            .then(configuration => {
                setEndpoint(configuration.sparql_endpoint ?? defaultEndpoint);
                setPrefix(configuration.prefix ?? defaultPrefix);
            })
            .catch(() => {
                setEndpoint(defaultEndpoint);
                setPrefix(defaultPrefix);
            });
    }, []);

    if (!prefix) {
        return null;
    }
    const footer = `${process.env.NEXT_PUBLIC_NAME?.toUpperCase()} : v${process.env.NEXT_PUBLIC_VERSION}`;
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
