import { render } from "@testing-library/react";
import App from "./App";
import { test, vi } from "vitest";

vi.stubGlobal("Yasgui", function Yasgui(e: HTMLElement) {
    const div = document.createElement("div");
    div.classList.add("yasqe");
    e.appendChild(div);
});
vi.stubGlobal("fetch", function fetch(url: string) {
    return Promise.resolve({
        json() {
            if (url.includes("/configuration.json")) {
                return Promise.resolve({});
            }
            return Promise.resolve([]);
        }
    });
});

test("renders the App component", () => {
    render(<App />);
});
