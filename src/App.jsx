import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";
import PropTypes from "prop-types";

const defaultEndpoint = "http://rdf.insee.fr/sparql";
const defaultPrefix = "https://rdf.insee.fr/sparql?query=DESCRIBE";

function Editor({ endpoint, queries, prefix }) {
    const [yasgui, setYasgui] = useState();
    const [counter, setCounter] = useState(0);
    const ref = useRef(null);

    const [inserted, setInserted] = useState(false);

    useLayoutEffect(() => {
        if (counter > 100 || inserted) {
            return;
        }
        if (document.querySelector(".yasqe")) {
            document.querySelector(".yasqe").appendChild(ref.current);
            setInserted(true);
        }
        setCounter(counter + 1);
    }, [counter, inserted]);

    const click = query => {
        fetch(query.path)
            .then(response => response.text())
            .then(body => {
                const tab = yasgui.getTab();
                tab.setQuery(body);
            });
    };

    useLayoutEffect(() => {
        localStorage.removeItem("yagui__config");
        setYasgui(
            // eslint-disable-next-line no-undef
            new Yasgui(document.getElementById("editor"), {
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
                    <button key={i} onClick={() => click(query)}>
                        {" "}
                        {query.label}{" "}
                    </button>
                ))}
            </div>
            <div
                id="editor"
                onClick={e => {
                    if (
                        endpoint !== defaultEndpoint &&
                        e.target.href &&
                        e.target.href.indexOf("http://id.insee.fr/") === 0 &&
                        e.target.href.indexOf(prefix) !== 0
                    ) {
                        e.target.href = prefix + encodeURIComponent(`<${e.target.href}>`);
                    }
                }}
            ></div>
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
        fetch("/queries/queries.json")
            .then(response => response.json())
            .then(body => {
                setQueries(body);
            });
    }, []);

    //
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

    return (
        <div className="App">
            {endpoint && <Editor endpoint={endpoint} queries={queries} prefix={prefix} />}
        </div>
    );
}

export default App;
