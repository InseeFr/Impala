import type { Metric } from "web-vitals";

type ReportHandler = (metric: Metric) => void;

// web-vitals 4 a supprime les anciennes fonctions `getXXX` au profit de
// `onXXX` (et remplace FID par INP).
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        import("web-vitals").then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
            onCLS(onPerfEntry);
            onFCP(onPerfEntry);
            onINP(onPerfEntry);
            onLCP(onPerfEntry);
            onTTFB(onPerfEntry);
        });
    }
};

export default reportWebVitals;
