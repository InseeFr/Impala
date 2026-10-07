import React from "react";
import App from "./App";
import "./index.css";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (!container) {
    throw new Error("Element #root introuvable : index.html a-t-il ete modifie ?");
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
