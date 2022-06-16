import "./App.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const apiURL = `${window.location.origin}/configuration.json`;

function App() {
  const [queries, setQueries] = useState([]);
  const ref = useRef(null);
  const [yasgui, setYasgui] = useState();
  const [counter, setCounter] = useState(0);
  const [inserted, setInserted] = useState(false);
  const [sparqlEndpoint, setSparqlEndpoint] = useState(null);

  useLayoutEffect(() => {
    if (sparqlEndpoint) {
      if (counter > 100 || inserted) {
        return;
      }
      if (document.querySelector(".yasqe")) {
        document.querySelector(".yasqe").appendChild(ref.current);
        setInserted(true);
      }
      setCounter(counter + 1);
    }
  }, [sparqlEndpoint, counter, inserted]);

  const click = (query) => {
    fetch(query.path)
      .then((response) => response.text())
      .then((body) => {
        const tab = yasgui.getTab();
        tab.setQuery(body);
      });
  };

  useEffect(() => {
    fetch(apiURL)
      .then((response) => response.json())
      .then((config) => {
        setSparqlEndpoint(config.sparql_endpoint);
      });
  }, []);

  useEffect(() => {
    fetch("/queries/queries.json")
      .then((response) => response.json())
      .then((body) => {
        setQueries(body);
      });
  }, []);

  useLayoutEffect(() => {
    sparqlEndpoint &&
      setYasgui(
        // eslint-disable-next-line no-undef
        new Yasgui(document.getElementById("editor"), {
          requestConfig: {
            endpoint: sparqlEndpoint,
          },
        })
      );
  }, [sparqlEndpoint]);

  if (!sparqlEndpoint) return <div>Loading</div>;

  return (
    <div className="App">
      <div className="queries-block" ref={ref}>
        {queries.map((query, i) => (
          <button key={i} onClick={() => click(query)}>
            {query.label}
          </button>
        ))}
      </div>
      <div id="editor"></div>
    </div>
  );
}

export default App;
