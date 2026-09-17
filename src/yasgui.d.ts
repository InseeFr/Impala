// Yasgui est charge par une balise <script> dans index.html (public/yasgui.min.js)
// et n'est donc pas importe : il n'existe qu'en tant que global. On decrit ici la
// portion de son API utilisee par l'application.
interface YasguiConfig {
    requestConfig?: {
        endpoint?: string;
    };
}

interface YasguiTab {
    setQuery(query: string): void;
}

declare class Yasgui {
    constructor(element: HTMLElement, config?: YasguiConfig);
    getTab(): YasguiTab;
}
