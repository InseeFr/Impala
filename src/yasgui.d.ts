// Yasgui est chargé par une balise <script> dans index.html (public/yasgui.min.js),
// pas via un import : il n'existe qu'en global et n'expose aucun typage propre.
// On déclare ici la portion de son API réellement utilisée par l'application.

interface YasguiTab {
    setQuery(query: string): void;
}

interface YasguiInstance {
    getTab(): YasguiTab;
}

interface YasguiOptions {
    requestConfig?: {
        endpoint?: string;
    };
}

declare const Yasgui: new (element: HTMLElement, options?: YasguiOptions) => YasguiInstance;
