import './App.css';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';


function App() {
  const [queries, setQueries] = useState([])
  const ref = useRef(null);
  const [yasgui, setYasgui] = useState()
  const [counter, setCounter] = useState(0)
  const [inserted, setInserted] = useState(false)

  useLayoutEffect(() => {
    if(counter > 100 || inserted){
      return;
    }
    if(document.querySelector(".yasqe")){
      document.querySelector(".yasqe").appendChild(ref.current)
      setInserted(true)
    }
    setCounter(counter + 1)
  }, [counter, inserted])

  const click = (query) => {
    fetch(query.path)
      .then(response => response.text())
      .then(body => {
        const tab = yasgui.getTab();
        tab.setQuery(body);
      })  
  }

  useEffect(() => {
    fetch("/queries/queries.json")
      .then(response => response.json())
      .then(body => {
        setQueries(body)
      })
  }, []);

  useLayoutEffect(() => {
    // eslint-disable-next-line no-undef
    setYasgui(new Yasgui(document.getElementById("editor"), {
      requestConfig: {
        endpoint: 'http://rdf.insee.fr/sparql'
      }
    }))
  }, []);

  return (
    <div className="App">
      <div className="queries-block" ref={ref}>
        {
          queries.map((query, i) => <button key={i} onClick={() => click(query)}> {query.label}  </button>)
        }
      </div>
      <div id="editor"></div>
    </div>
  );
}

export default App;
