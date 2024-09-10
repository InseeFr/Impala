import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import vitest from "eslint-plugin-vitest";

export default [
    {
        files: ["**/*.{js,mjs,cjs,jsx}"],
        plugins: {
            vitest
        },
        rules: {
            ...vitest.configs.recommended.rules,
            "vitest/expect-expect": "off"
        }
    },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    pluginReact.configs.flat.recommended
];
